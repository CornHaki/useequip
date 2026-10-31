import React, { useState } from 'react';
import { CalendarClock, FileCheck2, ShieldCheck } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { useQualifications } from '../../hooks/useQualifications';
import { useEquipment } from '../../hooks/useEquipment';
import { useAuth } from '../../context/AuthContext';
import { getEffectiveQualificationType, getQualificationTypeLabel } from '../../config/equipmentCategories';
import PrivateQualificationEvidence from '../common/PrivateQualificationEvidence';

const formatTimestamp = value => value?.toDate
  ? value.toDate().toLocaleString()
  : value ? new Date(value).toLocaleString() : '';

export default function QualificationManagement() {
  const { qualifications, qualificationGrants, reviewQualification, grantQualificationToEquipment } = useQualifications();
  const { resources } = useEquipment();
  const { user } = useAuth();
  const [notes, setNotes] = useState({});
  const [expires, setExpires] = useState({});
  const [scheduledAt, setScheduledAt] = useState({});
  const [selectedResource, setSelectedResource] = useState({});

  const ownedResources = resources.filter(resource => resource.ownerUid === user?.uid);
  const reviewable = qualifications.filter(qualification => (
    ['Pending', 'Verified'].includes(qualification.status)
  ));

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-textMain">Equipment Qualifications</h2>
        <p className="mt-1 text-sm text-textMain/75">Review private evidence, schedule practical assessments, and manage qualification validity.</p>
      </div>
      <div className="space-y-4">
        {qualifications.map(qualification => {
          const expiresAt = qualification.expiresAt?.toDate ? qualification.expiresAt.toDate() : null;
          const eligibleResources = ownedResources.filter(resource => (
            (!expiresAt || expiresAt > new Date())
            && resource.id !== qualification.equipmentId
            && resource.qualificationReusable
            && getEffectiveQualificationType(resource) === qualification.qualificationType
            && (resource.categoryId || resource.category) === qualification.categoryId
            && !qualificationGrants.some(grant => grant.qualificationId === qualification.id && grant.resourceId === resource.id && grant.active)
          ));
          const isPending = qualification.status === 'Pending';
          const isAssessment = qualification.submissionType === 'assessment';

          return (
            <article key={qualification.id} className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-textMain">{qualification.equipmentName}</h3>
                  <p className="mt-1 text-xs text-textMain/70">
                    {qualification.userName} · {getQualificationTypeLabel(qualification.qualificationType)} · Submitted {formatTimestamp(qualification.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-textMain/70">Submission: {qualification.submissionType}</p>
                </div>
                <StatusBadge status={qualification.status} />
              </div>

              {qualification.experienceDetails && (
                <p className="mt-4 whitespace-pre-wrap rounded-xl bg-secondary/60 p-3 text-sm text-textMain">{qualification.experienceDetails}</p>
              )}
              {qualification.hasEvidence && <PrivateQualificationEvidence qualificationId={qualification.id} fileName={qualification.evidenceName} />}
              {qualification.assessmentScheduledAt && (
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-textMain/80">
                  <CalendarClock className="h-4 w-4 text-accent" />
                  Practical assessment: {formatTimestamp(qualification.assessmentScheduledAt)}
                </p>
              )}
              {qualification.assessmentStatus && qualification.assessmentStatus !== 'Not Requested' && (
                <p className="mt-2 text-xs text-textMain/70">Assessment status: {qualification.assessmentStatus}</p>
              )}
              {qualification.reviewerNotes && (
                <p className="mt-3 text-sm text-textMain/80"><strong>Review notes:</strong> {qualification.reviewerNotes}</p>
              )}
              {qualification.expiresAt && (
                <p className="mt-2 text-xs text-textMain/70">Valid until {formatTimestamp(qualification.expiresAt)}</p>
              )}

              {isPending && (
                <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
                  <label className="block text-xs font-bold text-textMain">
                    Review notes
                    <textarea
                      rows={2}
                      maxLength={2000}
                      value={notes[qualification.id] ?? qualification.reviewerNotes ?? ''}
                      onChange={event => setNotes(current => ({ ...current, [qualification.id]: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm font-normal"
                      placeholder="Explain your decision or next steps."
                    />
                  </label>
                  {isAssessment ? (
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <label className="block text-xs font-bold text-textMain">
                        Assessment date and time
                        <input
                          type="datetime-local"
                          required
                          value={scheduledAt[qualification.id] || ''}
                          onChange={event => setScheduledAt(current => ({ ...current, [qualification.id]: event.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm font-normal"
                        />
                      </label>
                      {qualification.assessmentStatus !== 'Scheduled' && (
                        <button
                          type="button"
                          onClick={() => reviewQualification(qualification.id, 'schedule', notes[qualification.id] || '', { scheduledAt: scheduledAt[qualification.id] })}
                          className="self-end rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-textMain hover:bg-secondary"
                        >
                          Schedule Assessment
                        </button>
                      )}
                    </div>
                  ) : (
                    <label className="block max-w-sm text-xs font-bold text-textMain">
                      Optional expiration date
                      <input
                        type="date"
                        value={expires[qualification.id] || ''}
                        onChange={event => setExpires(current => ({ ...current, [qualification.id]: event.target.value }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm font-normal"
                      />
                    </label>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {isAssessment && qualification.assessmentStatus === 'Scheduled' ? (
                      <>
                        <button type="button" onClick={() => reviewQualification(qualification.id, 'Passed', notes[qualification.id] || '', { expiresAt: expires[qualification.id] })} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-primary">
                          <FileCheck2 className="h-4 w-4" /> Record Pass
                        </button>
                        <button type="button" onClick={() => reviewQualification(qualification.id, 'Failed', notes[qualification.id] || '')} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-textMain hover:bg-secondary">Record Fail</button>
                        <button type="button" onClick={() => reviewQualification(qualification.id, 'Training Required', notes[qualification.id] || '')} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-textMain hover:bg-secondary">Training Required</button>
                      </>
                    ) : !isAssessment ? (
                      <>
                        <button type="button" onClick={() => reviewQualification(qualification.id, 'Verified', notes[qualification.id] || '', { expiresAt: expires[qualification.id] })} className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-primary">
                          <ShieldCheck className="h-4 w-4" /> Verify
                        </button>
                        <button type="button" onClick={() => reviewQualification(qualification.id, 'Rejected', notes[qualification.id] || '')} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-textMain hover:bg-secondary">Reject</button>
                      </>
                    ) : null}
                  </div>
                </div>
              )}

              {qualification.status === 'Verified' && (
                <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-200 pt-4">
                  <button type="button" onClick={() => reviewQualification(qualification.id, 'Revoked', notes[qualification.id] || 'Revoked by equipment owner.')} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-textMain hover:bg-secondary">Revoke</button>
                  <button type="button" onClick={() => reviewQualification(qualification.id, 'Expired', notes[qualification.id] || 'Marked expired by equipment owner.')} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-textMain hover:bg-secondary">Mark Expired</button>
                  {eligibleResources.length > 0 && (
                    <>
                      <label className="text-xs font-bold text-textMain">
                        Share with eligible item
                        <select
                          value={selectedResource[qualification.id] || ''}
                          onChange={event => setSelectedResource(current => ({ ...current, [qualification.id]: event.target.value }))}
                          className="mt-1 block min-w-56 rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm font-normal"
                        >
                          <option value="">Select equipment</option>
                          {eligibleResources.map(resource => <option key={resource.id} value={resource.id}>{resource.name}</option>)}
                        </select>
                      </label>
                      <button
                        type="button"
                        disabled={!selectedResource[qualification.id]}
                        onClick={() => {
                          const resource = eligibleResources.find(item => item.id === selectedResource[qualification.id]);
                          if (resource) grantQualificationToEquipment(qualification.id, resource);
                        }}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-textMain hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Share Qualification
                      </button>
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {reviewable.length === 0 && qualifications.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-surface p-6 text-center text-sm text-textMain/75">Qualification submissions will appear here for review.</div>
        )}
      </div>
    </section>
  );
}
