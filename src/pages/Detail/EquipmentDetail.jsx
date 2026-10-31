import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { useEquipment } from '../../hooks/useEquipment';
import { useBookings } from '../../hooks/useBookings';
import { useAuth } from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';
import { ArrowLeft, MapPin, ShieldCheck, ClipboardCheck, Flag } from 'lucide-react';
import { hasRole } from '../../utils/permissions';
import {
  getEffectiveQualificationType,
  getEquipmentCategoryLabel,
  getQualificationTypeLabel
} from '../../config/equipmentCategories';
import { useQualifications } from '../../hooks/useQualifications';

export default function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { resources } = useEquipment();
  const { handleBookingRequest, submitReport } = useBookings();
  const { submitQualification } = useQualifications();
  const { user } = useAuth();
  const { loading, qualifications, qualificationGrants } = useContext(DataContext);
  
  const res = resources.find(r => r.id === id);
  const [purpose, setPurpose] = useState('');
  const [qualificationFile, setQualificationFile] = useState(null);
  const [qualificationSubmissionType, setQualificationSubmissionType] = useState('assessment');
  const [qualificationDetails, setQualificationDetails] = useState('');
  const [supervisedAccess, setSupervisedAccess] = useState(false);
  const [slot, setSlot] = useState('Tomorrow, 10:00 AM – 2:00 PM');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('Damage');
  const [reportDescription, setReportDescription] = useState('');
  const [reportPhoto, setReportPhoto] = useState(null);

  if (!res && loading) {
    return <PageContainer><div className="rounded-2xl border border-slate-200 bg-surface p-8 text-center text-sm text-textMain/75">Loading equipment details…</div></PageContainer>;
  }
  if (!res) {
    return (
      <PageContainer>
        <div className="rounded-2xl border border-slate-200 bg-surface p-8 text-center shadow-sm">
          <h1 className="font-bold text-textMain">Equipment not found</h1>
          <button onClick={() => navigate(-1)} className="mt-4 text-sm font-bold text-accent">Back to equipment</button>
        </div>
      </PageContainer>
    );
  }
  const isOwner = res.ownerUid === user?.uid;
  const canRequest = hasRole(user, 'user') && !isOwner;
  const requiredQualificationType = getEffectiveQualificationType(res);
  const requiresQualification = requiredQualificationType !== 'none';
  const userQualifications = qualifications.filter(qualification => (
    qualification.userId === user?.uid
    && qualification.qualificationType === requiredQualificationType
  ));
  const verifiedQualification = userQualifications.find(qualification => {
    const expiresAt = qualification.expiresAt?.toDate
      ? qualification.expiresAt.toDate()
      : qualification.expiresAt ? new Date(qualification.expiresAt) : null;
    const isCurrent = qualification.status === 'Verified' && (!expiresAt || expiresAt > new Date());
    const hasGrant = qualificationGrants.some(grant => (
      grant.qualificationId === qualification.id
      && grant.resourceId === res.id
      && grant.active
    ));
    return isCurrent && (qualification.equipmentId === res.id || hasGrant);
  });
  const canRequestWithQualification = !requiresQualification || Boolean(verifiedQualification);
  const canRequestSupervised = requiresQualification && res.supervisedUseAllowed && supervisedAccess;
  const canSubmitQualification = requiresQualification && !verifiedQualification;
  const latestQualification = userQualifications.find(qualification => qualification.equipmentId === res.id);

  useEffect(() => {
    setQualificationSubmissionType(
      requiredQualificationType === 'practical_assessment'
        ? 'assessment'
        : requiredQualificationType === 'training_proof' ? 'training' : 'certificate'
    );
    setQualificationFile(null);
    setQualificationDetails('');
    setSupervisedAccess(false);
  }, [id, requiredQualificationType]);

  return (
    <PageContainer>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-textMain/80 hover:text-accent transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Equipment List
      </button>

      {/* Hero Section */}
      <div className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden relative border border-slate-200 shadow-md mb-8">
        <img src={res.image} alt={res.name} decoding="async" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
        <div className="absolute top-4 right-4 sm:hidden">
          <StatusBadge status={res.status} />
        </div>
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div>
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 text-xs font-bold mb-3 inline-block">
              {getEquipmentCategoryLabel(res.categoryId || res.category)}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">{res.name}</h1>
          </div>
          <div className="hidden sm:block bg-white/90 p-1 rounded-full shadow-sm">
            <StatusBadge status={res.status} />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
        {/* Left Side: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8 space-y-7">
            <div className="border-b border-slate-200 pb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-textMain">{res.name}</h2>
              <p className="text-sm text-textMain/80 flex items-center gap-2 mt-2">
                <MapPin className="w-4 h-4 text-accent" /> {res.location} • Manager: {res.ownerName}
              </p>
            </div>
            
            <div>
              {res.description && <p className="mb-5 text-sm leading-relaxed text-textMain/80">{res.description}</p>}
              {res.subcategory && <p className="mb-5 text-xs font-semibold text-textMain/70">{res.subcategory}</p>}
              <h3 className="text-sm font-bold text-textMain mb-3">Key Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(res.specs).map(([key, value]) => (
                  <div key={key} className="p-4 rounded-xl bg-secondary/70 border border-slate-200">
                    <p className="text-xs text-textMain/80 uppercase font-bold tracking-wider">{key}</p>
                    <p className="text-sm font-bold text-textMain mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-secondary/70 border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-accent" /> Required Training</h4>
                <ul className="space-y-2 text-sm font-medium">
                  {res.requirements.map((r,i) => <li key={i} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent" />{r}</li>)}
                </ul>
              </div>
              <div className="p-5 rounded-xl bg-secondary/70 border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-accent" /> Handover Checklist</h4>
                <ul className="space-y-2 text-sm font-medium">
                  {res.checklist.map((r,i) => <li key={i} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent" />{r}</li>)}
                </ul>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-secondary/60 p-5">
              <h4 className="text-sm font-bold text-textMain">Qualification and safety</h4>
              <p className="mt-2 text-sm text-textMain/80">{getQualificationTypeLabel(requiredQualificationType)}</p>
              {res.qualificationInstructions && <p className="mt-2 text-sm text-textMain/80">{res.qualificationInstructions}</p>}
              {res.safetyInstructions && <p className="mt-2 text-sm text-textMain/80"><strong>Safety:</strong> {res.safetyInstructions}</p>}
              {res.supervisedUseAllowed && <p className="mt-2 text-xs font-semibold text-textMain/70">Supervised access may be requested if you do not have a verified qualification.</p>}
            </div>
          </div>
        </div>

        {/* Right Side: User actions */}
        <div>
          {canRequest ? (
            <div className="bg-surface rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-6 lg:sticky lg:top-28">
            <div>
              <h2 className="text-xl font-bold text-textMain">Request to Borrow</h2>
              <p className="text-sm text-textMain/80 mt-1">Verify any required qualification before requesting independent access.</p>
            </div>
            {requiresQualification && (
              <div className="rounded-xl border border-slate-200 bg-secondary/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-textMain">{verifiedQualification ? 'Qualification verified' : 'Qualification required'}</p>
                    <p className="mt-1 text-xs text-textMain/75">{verifiedQualification ? getQualificationTypeLabel(requiredQualificationType) : res.qualificationInstructions || 'Submit evidence or request the required assessment.'}</p>
                  </div>
                  {verifiedQualification && <ShieldCheck className="h-5 w-5 shrink-0 text-accent" />}
                </div>
                {latestQualification && !verifiedQualification && (
                  <div className="mt-3 text-xs text-textMain/75">
                    <StatusBadge status={latestQualification.status} />
                    {latestQualification.assessmentStatus && latestQualification.assessmentStatus !== 'Not Requested' && <p className="mt-2">Assessment: {latestQualification.assessmentStatus}</p>}
                    {latestQualification.reviewerNotes && <p className="mt-2">{latestQualification.reviewerNotes}</p>}
                    {latestQualification.assessmentScheduledAt?.toDate && <p className="mt-2">Assessment: {latestQualification.assessmentScheduledAt.toDate().toLocaleString()}</p>}
                  </div>
                )}
              </div>
            )}

            {canSubmitQualification && (
              <form onSubmit={async event => {
                event.preventDefault();
                if (await submitQualification(res, qualificationSubmissionType, qualificationDetails, qualificationFile)) {
                  setQualificationFile(null);
                  setQualificationDetails('');
                }
              }} className="space-y-4 rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-textMain">Submit qualification</h3>
                {requiredQualificationType === 'practical_assessment' && (
                  <label className="block text-xs font-bold text-textMain">
                    Submission type
                    <select value={qualificationSubmissionType} onChange={event => { setQualificationSubmissionType(event.target.value); setQualificationFile(null); }} className="mt-1 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm font-normal">
                      <option value="assessment">Request practical assessment</option>
                      <option value="experience">Submit previous experience</option>
                      {res.trainingRequired && <option value="training">Submit training proof</option>}
                    </select>
                  </label>
                )}
                {(qualificationSubmissionType === 'experience' || qualificationSubmissionType === 'assessment') && (
                  <textarea rows={3} required maxLength={3000} value={qualificationDetails} onChange={event => setQualificationDetails(event.target.value)} placeholder={qualificationSubmissionType === 'assessment' ? 'Describe your experience and request an assessment.' : 'Describe your relevant experience.'} className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm" />
                )}
                {['certificate', 'training'].includes(qualificationSubmissionType) && (
                  <label className="block text-xs font-bold text-textMain">
                    Evidence (PDF, JPG, PNG, or WebP; private, size limited)
                    <input type="file" required accept=".pdf,image/jpeg,image/png,image/webp" onChange={event => setQualificationFile(event.target.files?.[0] || null)} className="mt-2 block w-full text-sm font-normal text-textMain file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:font-semibold" />
                    {qualificationFile && <span className="mt-1 block text-textMain/70">{qualificationFile.name}</span>}
                  </label>
                )}
                <Button type="submit" className="w-full py-3">Submit for Review</Button>
              </form>
            )}

            {res.supervisedUseAllowed && (
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-textMain">
                <input type="checkbox" checked={supervisedAccess} onChange={event => setSupervisedAccess(event.target.checked)} className="mt-1 accent-accent" />
                <span><strong>Request supervised access</strong><span className="mt-0.5 block text-xs text-textMain/70">The equipment owner must supervise use.</span></span>
              </label>
            )}

            {(canRequestWithQualification || canRequestSupervised) && (
              <form onSubmit={event => {
                event.preventDefault();
                handleBookingRequest(
                  res,
                  slot,
                  purpose,
                  supervisedAccess ? null : verifiedQualification?.id || null,
                  supervisedAccess,
                  () => navigate('/user-dashboard')
                );
              }} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-textMain mb-2">Choose a Time Slot</label>
                  <select value={slot} onChange={event => setSlot(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-surface px-3.5 py-3 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
                    <option value="Today, 2:00 PM – 6:00 PM">Today, 2:00 PM – 6:00 PM</option>
                    <option value="Tomorrow, 10:00 AM – 2:00 PM">Tomorrow, 10:00 AM – 2:00 PM</option>
                    <option value="Thursday, 9:00 AM – 1:00 PM">Thursday, 9:00 AM – 1:00 PM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-textMain mb-2">What will you use it for?</label>
                  <textarea rows={3} required value={purpose} onChange={event => setPurpose(event.target.value)} placeholder="Describe your project..." className="w-full rounded-xl border border-slate-200 bg-surface px-3.5 py-3 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
                </div>
                <Button type="submit" className="mt-2 w-full py-3.5">{res.status === 'Available' ? 'Send Borrow Request' : 'Join Waiting List'}</Button>
              </form>
            )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-surface p-5 sm:p-7 shadow-sm">
              <h2 className="text-lg font-bold text-textMain">{hasRole(user, 'admin') ? 'Equipment management' : 'Your equipment'}</h2>
              <p className="mt-2 text-sm text-textMain/75">
                You cannot request access to equipment that you own.
              </p>
            </div>
          )}

          {hasRole(user, 'user') && (
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-surface px-4 py-3 text-sm font-bold text-textMain shadow-sm hover:border-accent hover:text-primary transition-colors"
            >
              <Flag className="h-4 w-4" /> Report Equipment
            </button>
          )}
        </div>
      </div>

      {showReportModal && (
        <Modal title="Report equipment" subtitle="Your report will be sent to the equipment owner for review." onClose={() => setShowReportModal(false)}>
          <form onSubmit={async event => {
            event.preventDefault();
            if (await submitReport(res, reportCategory, reportDescription, reportPhoto)) {
              setShowReportModal(false);
              setReportDescription('');
              setReportPhoto(null);
            }
          }} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-textMain">Equipment</label>
              <input value={res.name} readOnly className="w-full rounded-xl border border-slate-200 bg-secondary px-4 py-3 text-sm text-textMain" />
            </div>
            <div>
              <label htmlFor="report-category" className="mb-2 block text-sm font-bold text-textMain">Report category</label>
              <select id="report-category" value={reportCategory} onChange={event => setReportCategory(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-surface px-4 py-3 text-sm">
                <option>Damage</option>
                <option>Incorrect information</option>
                <option>Safety concern</option>
                <option>Suspicious activity</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="report-description" className="mb-2 block text-sm font-bold text-textMain">Description</label>
              <textarea id="report-description" required minLength={5} maxLength={2000} rows={4} value={reportDescription} onChange={event => setReportDescription(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-surface px-4 py-3 text-sm" placeholder="Describe the issue you noticed." />
            </div>
            <div>
              <label htmlFor="report-photo" className="mb-2 block text-sm font-bold text-textMain">Supporting photograph <span className="font-normal text-textMain/60">(optional)</span></label>
              <input id="report-photo" type="file" accept="image/*" onChange={event => setReportPhoto(event.target.files?.[0] || null)} className="block w-full text-sm text-textMain file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:font-semibold" />
              {reportPhoto && <p className="mt-2 text-xs text-textMain/70">{reportPhoto.name}</p>}
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowReportModal(false)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-textMain">Cancel</button>
              <button type="submit" className="rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white hover:bg-primary transition-colors">Submit Report</button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}