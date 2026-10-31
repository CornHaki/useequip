import React, { useContext, useEffect, useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { useBookings } from '../../hooks/useBookings';
import { useEquipment } from '../../hooks/useEquipment';
import { useAuth } from '../../context/AuthContext';
import { DataContext } from '../../context/DataContext';
import { Plus, Camera, CheckCircle2, X, XCircle, Sparkles, Clock, PackageCheck, ShieldCheck, Wrench, Flag, Bell, Pencil, Trash2 } from 'lucide-react';
import { EQUIPMENT_CATEGORIES, QUALIFICATION_TYPES, getEquipmentCategoryId } from '../../config/equipmentCategories';
import QualificationManagement from '../../components/admin/QualificationManagement';
import PrivateQualificationEvidence from '../../components/common/PrivateQualificationEvidence';

const EMPTY_EQUIPMENT_FORM = {
  name: '',
  category: '3d_printing_makerspace',
  location: '',
  description: '',
  subcategory: '',
  requirements: '',
  checklist: '',
  qualificationType: 'none',
  qualificationInstructions: '',
  trainingRequired: false,
  supervisedUseAllowed: false,
  qualificationReusable: false,
  safetyInstructions: '',
  image: null
};

const formatTimestamp = (timestamp) => timestamp?.toDate
  ? timestamp.toDate().toLocaleString()
  : timestamp || 'Pending';

export default function AdminDashboard() {
  const { bookings, handleOwnerDecision, resolveReturn, updateReportStatus } = useBookings();
  const { resources, handleCreateResource, updateResource, archiveResource, updateResourceStatus } = useEquipment();
  const { user } = useAuth();
  const { reports, notifications, qualifications, loading } = useContext(DataContext);
  const [showAddModal, setShowAddModal] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('Please upload the required safety training certificate.');
  const [newEqForm, setNewEqForm] = useState(EMPTY_EQUIPMENT_FORM);
  const [imagePreview, setImagePreview] = useState('');
  const [hideExistingImage, setHideExistingImage] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [archivingResource, setArchivingResource] = useState(null);
  const myResources = resources.filter(resource => resource.ownerUid === user?.uid);
  const pendingApprovalBookings = bookings.filter(b => b.ownerUid === user?.uid && ['Requested', 'Waitlisted'].includes(b.status));
  const returnedBookings = bookings.filter(b => b.ownerUid === user?.uid && b.status === 'Returned');
  const ownedReports = reports.filter(report => report.ownerUid === user?.uid);
  const pendingReports = ownedReports.filter(report => report.status === 'Pending').length;
  const availableResources = myResources.filter(resource => resource.status === 'Available').length;
  const activeResources = myResources.filter(resource => resource.status === 'In Use').length;
  const maintenanceResources = myResources.filter(resource => resource.status === 'Maintenance').length;

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const openAddResource = () => {
    setEditingResource(null);
    setNewEqForm(EMPTY_EQUIPMENT_FORM);
    setImagePreview('');
    setHideExistingImage(false);
    setShowAddModal(true);
  };

  const resetEquipmentForm = () => {
    setShowAddModal(false);
    setEditingResource(null);
    setNewEqForm(EMPTY_EQUIPMENT_FORM);
    setImagePreview('');
    setHideExistingImage(false);
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    const saved = editingResource
      ? await updateResource(editingResource.id, newEqForm, editingResource.imageData)
      : await handleCreateResource(newEqForm);
    if (saved) resetEquipmentForm();
  };

  const openEditResource = (resource) => {
    setEditingResource(resource);
    setNewEqForm({
      name: resource.name,
      category: resource.categoryId || getEquipmentCategoryId(resource.category),
      location: resource.location,
      description: resource.description || '',
      subcategory: resource.subcategory || '',
      requirements: (resource.requirements || []).join(', '),
      checklist: (resource.checklist || []).join(', '),
      qualificationType: resource.qualificationType || 'none',
      qualificationInstructions: resource.qualificationInstructions || '',
      trainingRequired: Boolean(resource.trainingRequired),
      supervisedUseAllowed: Boolean(resource.supervisedUseAllowed),
      qualificationReusable: Boolean(resource.qualificationReusable),
      safetyInstructions: resource.safetyInstructions || '',
      image: null
    });
    setImagePreview('');
    setHideExistingImage(false);
    setShowAddModal(true);
  };

  return (
    <PageContainer width="max-w-7xl">
      {/* Hero */}
      <div className="rounded-3xl bg-primary text-white p-7 sm:p-10 lg:p-12 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-bold text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Manager Command Center · {user?.name}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Share Institutional Labs & Hardware Without Risk.</h1>
          <p className="text-secondary/90 text-sm sm:text-base leading-relaxed">Verify student training certificates, enforce fair borrowing limits automatically, and review condition photos from one unified dashboard.</p>
        </div>
        <button onClick={openAddResource} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent hover:bg-white hover:text-primary text-white text-sm font-bold shadow-sm transition-colors shrink-0">
          <Plus className="w-4 h-4"/> List New Equipment
        </button>
      </div>

      <section aria-label="Fleet overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-surface rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-textMain/70">Pending Approvals</h2>
            <span className="w-7 h-7 rounded-lg bg-secondary text-accent flex items-center justify-center"><ShieldCheck className="w-4 h-4" /></span>
          </div>
          <p className="mt-3 text-lg font-extrabold text-textMain"><span className="text-2xl text-accent">{pendingApprovalBookings.length}</span> {pendingApprovalBookings.length === 1 ? 'Request' : 'Requests'}</p>
          <p className="mt-2 text-xs text-textMain/75 leading-relaxed">Verify each student's attached safety training before granting equipment access.</p>
        </div>
        <div className="bg-surface rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-textMain/70">Returns Needing Inspection</h2>
            <span className="w-7 h-7 rounded-lg bg-secondary text-accent flex items-center justify-center"><Camera className="w-4 h-4" /></span>
          </div>
          <p className="mt-3 text-lg font-extrabold text-textMain"><span className="text-2xl text-accent">{returnedBookings.length}</span> {returnedBookings.length === 1 ? 'Return' : 'Returned'}</p>
          <p className="mt-2 text-xs text-textMain/75 leading-relaxed">Compare before-and-after photos and review incident notes from borrowers.</p>
        </div>
        <div className="sm:col-span-2 lg:col-span-1 bg-surface rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-textMain/70">Total Fleet Status</h2>
            <span className="w-7 h-7 rounded-lg bg-secondary text-accent flex items-center justify-center"><PackageCheck className="w-4 h-4" /></span>
          </div>
          <p className="mt-3 text-lg font-extrabold text-textMain"><span className="text-2xl">{myResources.length}</span> Assets Listed</p>
          <p className="mt-2 text-xs text-textMain/75 leading-relaxed">
            {availableResources} available now · {activeResources} active · {maintenanceResources} in maintenance
          </p>
        </div>
      </section>

      <div className="space-y-10 sm:space-y-12">
        <QualificationManagement />

        {/* Pending Approvals */}
        <section className="space-y-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-textMain">1. Booking Requests Waiting for Your Approval</h2>
            <p className="text-sm text-textMain/80 mt-1">Check that the student has attached the required safety certificate before approving their request.</p>
          </div>
          <div className="space-y-4">
            {pendingApprovalBookings.map(booking => (
              <div key={booking.id} className="bg-surface rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-extrabold text-textMain">{booking.resourceName}</h3>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="text-sm text-textMain"><strong>Requested by:</strong> {booking.userName} • <span className="text-textMain/80">{booking.dateSlot}</span></p>
                  <p className="text-sm text-textMain"><strong>What it will be used for:</strong> <span className="text-textMain/80">{booking.purpose}</span></p>
                  {booking.supervisedAccess ? (
                    <p className="pt-2 text-xs font-bold text-primary">Supervised access requested</p>
                  ) : booking.qualificationId ? (
                    <div className="pt-2">
                      {(() => {
                        const qualification = qualifications.find(item => item.id === booking.qualificationId);
                        return qualification?.hasEvidence ? (
                          <PrivateQualificationEvidence qualificationId={qualification.id} fileName={qualification.evidenceName || 'qualification evidence'} />
                        ) : <p className="text-xs font-semibold text-textMain/75">Verified qualification attached to request.</p>;
                      })()}
                    </div>
                  ) : booking.certificateName ? (
                    <p className="pt-2 text-xs text-textMain/75">Legacy certificate: {booking.certificateName}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button onClick={() => handleOwnerDecision(booking.id, 'Approved')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-primary text-white text-sm font-bold shadow-sm transition-colors">
                    <CheckCircle2 className="w-4 h-4"/> Approve Request
                  </button>
                  <button onClick={() => handleOwnerDecision(booking.id, 'Waitlisted')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-slate-200 hover:bg-secondary text-textMain text-sm font-bold shadow-sm transition-colors">
                    <Clock className="w-4 h-4"/> Waitlist
                  </button>
                  <button onClick={() => setRejectingId(booking.id)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-slate-200 hover:bg-secondary text-textMain text-sm font-bold shadow-sm transition-colors">
                    <XCircle className="w-4 h-4"/> Decline
                  </button>
                </div>
              </div>
            ))}
            {pendingApprovalBookings.length === 0 && (
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-surface p-5 sm:p-6 shadow-sm">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-secondary flex items-center justify-center text-accent">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-textMain">You're all caught up</p>
                  <p className="text-sm text-textMain/80 mt-1">New booking requests will appear here for review.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Returns */}
        <section className="space-y-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-textMain">2. Returned Equipment & Condition Photos</h2>
            <p className="text-sm text-textMain/80 mt-1">Compare the "Before Use" and "After Use" photos. If a student reported an issue, a short summary appears at the top for your review.</p>
          </div>
          <div className="space-y-6">
            {returnedBookings.map(booking => (
              <div key={booking.id} className="bg-surface rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-6">
                 <div className="flex flex-col lg:flex-row justify-between gap-4">
                   <div className="space-y-2">
                     <div className="flex flex-wrap items-center gap-3"><h3 className="text-lg font-bold text-textMain">{booking.resourceName}</h3><StatusBadge status={booking.status} /></div>
                     <p className="text-sm text-textMain/80">Borrowed by <strong className="text-textMain">{booking.userName}</strong> • {booking.dateSlot}</p>
                   </div>
                   <div className="flex flex-wrap gap-2 shrink-0">
                     <button onClick={() => resolveReturn(booking.id, 'Good Condition')} className="px-4 py-2.5 rounded-xl bg-accent hover:bg-primary text-white text-xs sm:text-sm font-bold shadow-sm transition-colors">Good & Make Available</button>
                     <button onClick={() => resolveReturn(booking.id, 'Damaged')} className="px-4 py-2.5 rounded-xl bg-surface border border-slate-200 hover:bg-secondary text-textMain text-xs sm:text-sm font-bold shadow-sm transition-colors">Mark Damaged</button>
                     <button onClick={() => resolveReturn(booking.id, 'Maintenance')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-slate-200 hover:bg-secondary text-textMain text-xs sm:text-sm font-bold shadow-sm transition-colors"><Wrench className="w-4 h-4" /> Hold for Repair</button>
                   </div>
                 </div>
                 
                 {booking.incidentReport && (
                   <div className="p-5 rounded-xl bg-secondary border border-slate-200 space-y-3">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2 text-sm font-bold text-primary"><Sparkles className="w-4 h-4"/> Quick Issue Summary (For Manager Review)</div>
                       <span className="px-3 py-1 rounded bg-surface text-textMain border border-slate-200 text-xs font-bold shadow-sm">Waiting for Manager Review</span>
                     </div>
                     <p className="text-sm font-bold text-textMain bg-surface px-4 py-3 rounded-lg border border-slate-200 shadow-sm">{booking.incidentReport.aiSummary}</p>
                     <p className="text-sm text-textMain/80 mt-2"><strong className="text-textMain">Student's Note:</strong> "{booking.incidentReport.rawText}"</p>
                   </div>
                 )}
                 {booking.returnCondition && (
                   <div className="rounded-xl border border-slate-200 bg-secondary/60 px-4 py-3 text-sm text-textMain/80">
                     <strong className="text-textMain">Borrower return assessment:</strong> {booking.returnCondition.borrowerAssessment}
                     {booking.returnCondition.borrowerNote && <span> — {booking.returnCondition.borrowerNote}</span>}
                   </div>
                 )}
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-4 rounded-xl bg-secondary/70 border border-slate-200 flex gap-4 items-center">
                     {booking.checkInData?.photoUrl ? (
                       <img src={booking.checkInData.photoUrl} alt="Before" className="w-24 h-20 rounded-lg object-cover border border-slate-300 shrink-0" />
                     ) : <div className="w-24 h-20 bg-secondary rounded-lg shrink-0 flex justify-center items-center text-textMain/50 border border-slate-300"><Camera className="w-5 h-5" /></div>}
                     <div className="text-sm">
                       <p className="font-bold text-textMain">1. Photo Before Use ({formatTimestamp(booking.checkInData?.timestamp)})</p>
                       <p className="text-textMain/80 mt-1">{booking.checkInData?.conditionNote || 'All looks good.'}</p>
                     </div>
                   </div>
                   <div className="p-4 rounded-xl bg-secondary/70 border border-slate-200 flex gap-4 items-center">
                     {booking.checkOutData?.photoUrl ? (
                       <img src={booking.checkOutData.photoUrl} alt="After" className="w-24 h-20 rounded-lg object-cover border border-slate-300 shrink-0" />
                     ) : <div className="w-24 h-20 bg-secondary rounded-lg shrink-0 flex justify-center items-center text-textMain/50 border border-slate-300"><Camera className="w-5 h-5" /></div>}
                     <div className="text-sm">
                       <p className="font-bold text-textMain">2. Photo After Return ({formatTimestamp(booking.checkOutData?.timestamp)})</p>
                       <p className="text-textMain/80 mt-1">{booking.checkOutData?.conditionNote || 'All looks good.'}</p>
                     </div>
                   </div>
                 </div>
              </div>
            ))}
            {returnedBookings.length === 0 && (
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-surface p-5 sm:p-6 shadow-sm">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-secondary flex items-center justify-center text-accent">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-textMain">No returns to review</p>
                  <p className="text-sm text-textMain/80 mt-1">Equipment awaiting inspection will show up here.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-textMain">3. Equipment Reports</h2>
              <p className="text-sm text-textMain/80 mt-1">Review reports submitted about equipment you manage and record the outcome.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary">
              <Flag className="h-3.5 w-3.5" /> {pendingReports} pending
            </span>
          </div>
          <div className="space-y-4">
            {ownedReports.map(report => (
              <article key={report.id} className="rounded-2xl border border-slate-200 bg-surface p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-textMain">{report.resourceName}</h3>
                      <StatusBadge status={report.status} />
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-primary">{report.category}</span>
                    </div>
                    <p className="text-xs text-textMain/70">Reported by {report.userName}</p>
                    <p className="text-sm leading-relaxed text-textMain/85">{report.description}</p>
                  </div>
                  <label className="flex shrink-0 items-center gap-2 text-xs font-bold text-textMain">
                    Update status
                    <select value={report.status} onChange={event => updateReportStatus(report.id, event.target.value)} className="rounded-lg border border-slate-200 bg-surface px-3 py-2 text-xs">
                      {['Pending', 'Under Review', 'Resolved', 'Rejected'].map(status => <option key={status}>{status}</option>)}
                    </select>
                  </label>
                </div>
                {report.photoUrl && <a href={report.photoUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-xs font-bold text-accent hover:text-primary">View supporting photograph</a>}
              </article>
            ))}
            {!loading && ownedReports.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-surface p-6 text-center text-sm text-textMain/75">There are no equipment reports for your listings.</div>
            )}
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-textMain">4. Your Equipment</h2>
            <p className="text-sm text-textMain/80 mt-1">Manage availability and condition for your own listings.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {myResources.map(resource => (
              <article key={resource.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
                <img src={resource.image} alt="" className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 object-cover" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-textMain">{resource.name}</h3>
                  <div className="mt-1"><StatusBadge status={resource.status} /></div>
                </div>
                {resource.status !== 'In Use' && (
                  <select
                    value={resource.status}
                    onChange={event => updateResourceStatus(resource.id, event.target.value)}
                    aria-label={`Set availability for ${resource.name}`}
                    className="max-w-36 rounded-lg border border-slate-200 bg-surface px-2 py-2 text-xs font-semibold"
                  >
                    <option value="Available">Available</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                )}
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => openEditResource(resource)} aria-label={`Edit ${resource.name}`} className="rounded-lg border border-slate-200 p-2 text-textMain hover:border-accent hover:text-primary">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setArchivingResource(resource)} aria-label={`Remove ${resource.name}`} className="rounded-lg border border-slate-200 p-2 text-textMain hover:border-accent hover:text-primary">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
            {!loading && myResources.length === 0 && (
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-surface p-6 text-center text-sm text-textMain/75">You have not listed equipment yet.</div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-textMain"><Bell className="h-5 w-5 text-accent" /> Notifications</h2>
          {notifications.slice(0, 5).map(notification => (
            <div key={notification.id} className="rounded-xl border border-slate-200 bg-surface px-4 py-3">
              <p className="text-sm font-bold text-textMain">{notification.title}</p>
              <p className="mt-1 text-sm text-textMain/75">{notification.message}</p>
            </div>
          ))}
          {!loading && notifications.length === 0 && <p className="text-sm text-textMain/70">No new notifications.</p>}
        </section>

      </div>

      {showAddModal && (
        <Modal title={editingResource ? 'Edit Equipment' : 'Add New Equipment'} subtitle="List a tool or lab space and set its training requirements." onClose={resetEquipmentForm}>
          <form onSubmit={submitAdd} className="space-y-6">
            <div>
              <label className="block font-bold text-textMain mb-2 text-sm">Equipment Photo {editingResource ? '(Optional)' : '(Required)'}</label>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 sm:p-8 text-center bg-secondary/50">
                {imagePreview || (editingResource?.image && !hideExistingImage) ? (
                  <div className="relative inline-block">
                    <img src={imagePreview || editingResource?.image} alt="Preview" className="h-32 rounded-lg object-cover shadow-sm border border-slate-200" />
                    <button type="button" onClick={() => { setNewEqForm(p => ({...p, image: null})); setImagePreview(''); setHideExistingImage(true); }} aria-label="Remove equipment photo" className="absolute -top-3 -right-3 bg-surface text-textMain rounded-full w-8 h-8 shadow-md border border-slate-200 flex items-center justify-center hover:scale-105 transition-transform"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <Camera className="w-8 h-8 mx-auto text-accent mb-3"/>
                    <p className="text-sm text-textMain/80 mb-1">Upload a clear, original photo of the equipment.</p>
                    <p className="text-xs text-textMain/60 mb-4">JPG, PNG up to 5MB</p>
                    <label className="cursor-pointer px-5 py-2.5 bg-surface border border-slate-200 rounded-lg text-sm font-bold shadow-sm inline-block hover:border-accent hover:text-accent transition-colors">
                      Browse Files
                      <input type="file" required={!editingResource || !editingResource.imageData} accept="image/*" className="hidden" onChange={e => { if(e.target.files[0]) { setNewEqForm(p => ({...p, image: e.target.files[0]})); setImagePreview(URL.createObjectURL(e.target.files[0])); setHideExistingImage(false); } }} />
                    </label>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <label className="block font-bold text-textMain mb-2 text-sm">Equipment Name</label>
              {/* bg-white ensures inputs don't blend into the modal background */}
              <input type="text" required placeholder="e.g., Formlabs 3D Resin Printer" value={newEqForm.name} onChange={e => setNewEqForm(p => ({...p, name: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-surface shadow-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm transition-colors" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-textMain mb-2 text-sm">Category</label>
                <select value={newEqForm.category} onChange={e => setNewEqForm(p => ({...p, category: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-surface shadow-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm transition-colors">
                  {EQUIPMENT_CATEGORIES.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-textMain mb-2 text-sm">Room / Location</label>
                <input type="text" required placeholder="e.g., Makerspace Room C-210" value={newEqForm.location} onChange={e => setNewEqForm(p => ({...p, location: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-surface shadow-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm transition-colors" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-textMain mb-2 text-sm">Subcategory</label>
                <input type="text" maxLength={120} placeholder="e.g., Resin printer" value={newEqForm.subcategory} onChange={e => setNewEqForm(p => ({...p, subcategory: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-surface shadow-sm text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
              </div>
              <div>
                <label className="block font-bold text-textMain mb-2 text-sm">Qualification requirement</label>
                <select value={newEqForm.qualificationType} onChange={e => setNewEqForm(p => ({...p, qualificationType: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-surface shadow-sm text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent">
                  {QUALIFICATION_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-textMain mb-2 text-sm">Equipment description</label>
              <textarea rows={3} maxLength={2000} value={newEqForm.description} onChange={e => setNewEqForm(p => ({...p, description: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-surface shadow-sm text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent" placeholder="Describe the equipment and its intended use." />
            </div>

            <div>
              <label className="block font-bold text-textMain mb-2 text-sm">Qualification and training instructions</label>
              <textarea rows={2} maxLength={1200} value={newEqForm.qualificationInstructions} onChange={e => setNewEqForm(p => ({...p, qualificationInstructions: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-surface shadow-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm transition-colors" placeholder="Explain what evidence, training, or practical assessment is required." />
            </div>

            <div>
              <label className="block font-bold text-textMain mb-2 text-sm">Required training names (comma-separated)</label>
              <input type="text" placeholder="e.g., Lab Safety Orientation, Resin Printer Intro" value={newEqForm.requirements} onChange={e => setNewEqForm(p => ({...p, requirements: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-surface shadow-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm transition-colors" />
            </div>

            <div>
              <label className="block font-bold text-textMain mb-2 text-sm">Pickup checklist items (comma-separated)</label>
              <input type="text" placeholder="e.g., Tank is clean, Build plate attached, Power cable present" value={newEqForm.checklist} onChange={e => setNewEqForm(p => ({...p, checklist: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-surface shadow-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm transition-colors" />
            </div>

            <div>
              <label className="block font-bold text-textMain mb-2 text-sm">Safety instructions</label>
              <textarea rows={2} maxLength={2000} value={newEqForm.safetyInstructions} onChange={e => setNewEqForm(p => ({...p, safetyInstructions: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-surface shadow-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm transition-colors" placeholder="List essential operating and protective-equipment guidance." />
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-secondary/50 p-4">
              <label className="flex items-start gap-3 text-sm text-textMain">
                <input type="checkbox" checked={newEqForm.trainingRequired} onChange={e => setNewEqForm(p => ({...p, trainingRequired: e.target.checked}))} className="mt-1 accent-accent" />
                <span><strong>Training is required before access</strong><span className="mt-0.5 block text-xs text-textMain/70">Borrowers must submit training proof or complete the required training.</span></span>
              </label>
              <label className="flex items-start gap-3 text-sm text-textMain">
                <input type="checkbox" checked={newEqForm.supervisedUseAllowed} onChange={e => setNewEqForm(p => ({...p, supervisedUseAllowed: e.target.checked}))} className="mt-1 accent-accent" />
                <span><strong>Allow supervised access</strong><span className="mt-0.5 block text-xs text-textMain/70">A borrower without verified qualification may request owner-supervised use.</span></span>
              </label>
              <label className="flex items-start gap-3 text-sm text-textMain">
                <input type="checkbox" checked={newEqForm.qualificationReusable} onChange={e => setNewEqForm(p => ({...p, qualificationReusable: e.target.checked}))} className="mt-1 accent-accent" />
                <span><strong>Allow qualification reuse</strong><span className="mt-0.5 block text-xs text-textMain/70">You can explicitly share a verified qualification with your matching equipment.</span></span>
              </label>
            </div>

            <div className="pt-4 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={resetEquipmentForm} className="px-6 py-3 rounded-xl border border-slate-200 text-textMain/80 font-bold hover:text-textMain hover:bg-secondary transition-colors">Cancel</button>
              <button type="submit" className="px-6 py-3 rounded-xl bg-accent hover:bg-primary text-white font-bold shadow-sm transition-colors">{editingResource ? 'Save Changes' : 'Save & Publish'}</button>
            </div>
          </form>
        </Modal>
      )}

      {rejectingId && (
        <Modal title="Decline Request" subtitle="Let the student know why." onClose={() => setRejectingId(null)}>
          <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-surface shadow-sm text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors mb-4" rows="3" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
          <div className="flex justify-end gap-3 shrink-0">
            <button type="button" onClick={() => setRejectingId(null)} className="px-6 py-3 rounded-xl border border-slate-200 text-textMain/80 font-bold hover:text-textMain hover:bg-secondary transition-colors">Cancel</button>
            <button type="button" onClick={() => { handleOwnerDecision(rejectingId, 'Rejected', rejectReason); setRejectingId(null); }} className="px-6 py-3 rounded-xl bg-surface border border-slate-200 hover:bg-secondary text-textMain font-bold shadow-sm transition-colors">Decline Request</button>
          </div>
        </Modal>
      )}
      {archivingResource && (
        <Modal title="Remove equipment listing?" subtitle="This archives the listing without deleting transaction history. Items with open bookings cannot be removed." onClose={() => setArchivingResource(null)}>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setArchivingResource(null)} className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-bold text-textMain">Keep Listing</button>
            <button type="button" onClick={async () => { if (await archiveResource(archivingResource.id)) setArchivingResource(null); }} className="px-5 py-3 rounded-xl bg-accent text-sm font-bold text-white hover:bg-primary transition-colors">Archive Listing</button>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}