'use client';

import React, { useState } from 'react';
import {
  IssueWithCounts,
  IssueStatus,
  IssueUrgency,
  MaintenanceTeam,
  Profile,
} from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  CheckCircle,
  XCircle,
  Users,
  AlertTriangle,
  RotateCcw,
  CopyCheck,
  Send,
} from 'lucide-react';

interface Props {
  issue: IssueWithCounts;
  teams: MaintenanceTeam[];
  technicians: Profile[];
  currentUserId: string;
}

export function AdminTriagePanel({
  issue,
  teams,
  technicians,
  currentUserId,
}: Props) {
  const [status, setStatus] = useState<IssueStatus>(issue.status);
  const [urgency, setUrgency] = useState<IssueUrgency>(issue.urgency);
  const [assignedTeamId, setAssignedTeamId] = useState<string>(
    issue.assigned_team_id || ''
  );
  const [assignedTo, setAssignedTo] = useState<string>(issue.assigned_to || '');
  const [resolutionNotes, setResolutionNotes] = useState<string>(
    issue.resolution_notes || ''
  );
  const [rejectionReason, setRejectionReason] = useState<string>(
    issue.rejection_reason || ''
  );
  const [duplicateOf, setDuplicateOf] = useState<string>(
    issue.duplicate_of || ''
  );
  const [updateMessage, setUpdateMessage] = useState<string>('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleSaveTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation rules from PRD
    if (status === 'Resolved' && !resolutionNotes.trim()) {
      setErrorMsg('Resolution notes are strictly required when resolving an issue.');
      setLoading(false);
      return;
    }

    if (status === 'Rejected' && !rejectionReason.trim()) {
      setErrorMsg('A rejection reason visible to the reporter is required when rejecting an issue.');
      setLoading(false);
      return;
    }

    try {
      const now = new Date().toISOString();
      const updatesPayload: Partial<IssueWithCounts> & {
        updated_at: string;
        resolved_at?: string | null;
        closed_at?: string | null;
      } = {
        status,
        urgency,
        assigned_team_id: assignedTeamId || null,
        assigned_to: assignedTo || null,
        duplicate_of: duplicateOf || null,
        resolution_notes: status === 'Resolved' ? resolutionNotes.trim() : issue.resolution_notes,
        rejection_reason: status === 'Rejected' ? rejectionReason.trim() : issue.rejection_reason,
        updated_at: now,
      };

      if (status === 'Resolved' && issue.status !== 'Resolved') {
        updatesPayload.resolved_at = now;
      }
      if (status === 'Closed' && issue.status !== 'Closed') {
        updatesPayload.closed_at = now;
      }

      // 1. Update the issue record
      const { error: issueError } = await supabase
        .from('issues')
        .update(updatesPayload)
        .eq('id', issue.id);

      if (issueError) throw issueError;

      // 2. Insert Timeline update if status changed
      if (status !== issue.status) {
        let updateType: any = 'status_change';
        let msg = `Status changed from "${issue.status}" to "${status}".`;

        if (status === 'Resolved') {
          updateType = 'resolution';
          msg = `Resolved: ${resolutionNotes.trim()}`;
        } else if (status === 'Rejected') {
          updateType = 'rejection';
          msg = `Rejected: ${rejectionReason.trim()}`;
        } else if (
          (issue.status === 'Resolved' || issue.status === 'Closed') &&
          status === 'In Progress'
        ) {
          updateType = 'reopened';
          msg = `Reopened: Work marked back In Progress. ${updateMessage.trim() || ''}`.trim();
        }

        await supabase.from('issue_updates').insert({
          issue_id: issue.id,
          author_id: currentUserId,
          update_type: updateType,
          message: msg,
          old_value: issue.status,
          new_value: status,
          is_internal: false,
        });

        // Send notification to the reporter
        await supabase.from('notifications').insert({
          user_id: issue.created_by,
          issue_id: issue.id,
          title: `Issue Status: ${status}`,
          message: `Your report "${issue.title}" has been updated to "${status}".`,
          is_read: false,
        });

        // Trigger n8n automation webhook (non-blocking)
        fetch('/api/webhooks/n8n', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'status_change',
            data: {
              issueId: issue.id,
              title: issue.title,
              oldStatus: issue.status,
              newStatus: status,
              urgency,
              resolutionNotes: status === 'Resolved' ? resolutionNotes.trim() : null,
              rejectionReason: status === 'Rejected' ? rejectionReason.trim() : null,
              updatedBy: currentUserId,
            },
          }),
        }).catch((err) => console.warn('n8n status_change dispatch error:', err));
      }

      // 3. Insert assignment timeline update if assigned team/user changed
      if (
        assignedTeamId !== (issue.assigned_team_id || '') ||
        assignedTo !== (issue.assigned_to || '')
      ) {
        const teamObj = teams.find((t) => t.id === assignedTeamId);
        const techObj = technicians.find((t) => t.id === assignedTo);

        const assignText = [
          teamObj ? `Team: ${teamObj.name}` : null,
          techObj ? `Tech: ${techObj.full_name}` : null,
        ]
          .filter(Boolean)
          .join(', ');

        await supabase.from('issue_updates').insert({
          issue_id: issue.id,
          author_id: currentUserId,
          update_type: 'assignment',
          message: `Work assignment updated to ${assignText || 'Unassigned'}.`,
          new_value: assignText,
          is_internal: false,
        });

        // Notify reporter of assignment
        await supabase.from('notifications').insert({
          user_id: issue.created_by,
          issue_id: issue.id,
          title: 'Maintenance Assigned',
          message: `Your report "${issue.title}" was assigned to ${teamObj?.name || 'facilities crew'}.`,
          is_read: false,
        });
      }

      // 4. Duplicate linked update if changed
      if (duplicateOf && duplicateOf !== (issue.duplicate_of || '')) {
        await supabase.from('issue_updates').insert({
          issue_id: issue.id,
          author_id: currentUserId,
          update_type: 'duplicate_linked',
          message: `Marked as duplicate of canonical issue #${duplicateOf}`,
          new_value: duplicateOf,
          is_internal: false,
        });
      }

      // 5. Additional custom comment/update if provided
      if (updateMessage.trim()) {
        await supabase.from('issue_updates').insert({
          issue_id: issue.id,
          author_id: currentUserId,
          update_type: 'comment',
          message: updateMessage.trim(),
          is_internal: isInternal,
        });
        setUpdateMessage('');
      }

      setSuccessMsg('Issue triage and maintenance status saved successfully!');
      router.refresh();
    } catch (err: any) {
      console.error('Failed to update issue triage:', err);
      setErrorMsg(err.message || 'Failed to update issue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSaveTriage}
      className="bg-white rounded-2xl border border-indigo-200/90 shadow-md p-6 space-y-6"
    >
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 text-indigo-900">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg">Administrative Triage & Management</h3>
            <p className="text-xs text-slate-500">
              Update workflow status, assign facilities teams, and communicate official updates.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Workflow Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as IssueStatus)}
            className="w-full text-xs font-semibold rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Urgency Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Urgency Priority</label>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as IssueUrgency)}
            className="w-full text-xs font-semibold rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        {/* Maintenance Team Assignment */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Assign Maintenance Team</label>
          <select
            value={assignedTeamId}
            onChange={(e) => setAssignedTeamId(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- No Team Assigned --</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Lead Technician */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Responsible Assignee / Tech</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Unassigned Staff Member --</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.full_name} ({tech.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resolution Notes required if status is Resolved */}
      {status === 'Resolved' && (
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
          <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Official Resolution Summary (Required)
          </label>
          <p className="text-[11px] text-emerald-700">
            Explain what actions were taken to fix the issue. This will be published to the timeline and visible to the reporter.
          </p>
          <textarea
            rows={3}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="e.g. Replaced faulty circuit breaker in panel 3B, tested ground resistance and verified normal load."
            className="w-full text-xs rounded-lg border border-emerald-300 bg-white p-2.5 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      )}

      {/* Rejection Reason required if status is Rejected */}
      {status === 'Rejected' && (
        <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5">
          <label className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-600" />
            Rejection Reason (Required)
          </label>
          <p className="text-[11px] text-rose-700">
            Provide a clear explanation to the student/staff member why this request cannot be handled by campus facilities.
          </p>
          <textarea
            rows={2}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Outside university jurisdiction or personal property."
            className="w-full text-xs rounded-lg border border-rose-300 bg-white p-2.5 focus:ring-2 focus:ring-rose-500"
          />
        </div>
      )}

      {/* Duplicate linking input */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <CopyCheck className="w-4 h-4 text-slate-500" />
          Canonical Issue ID (if marking as duplicate)
        </label>
        <input
          type="text"
          value={duplicateOf}
          onChange={(e) => setDuplicateOf(e.target.value.trim())}
          placeholder="e.g. b0000000-0000-0000-0000-000000000001"
          className="w-full text-xs font-mono rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Official Timeline Note / Message */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-700">
          Append Official Timeline Update / Technician Note (Optional)
        </label>
        <textarea
          rows={2}
          value={updateMessage}
          onChange={(e) => setUpdateMessage(e.target.value)}
          placeholder="e.g. Parts arrived from warehouse; scheduling floor access for Tuesday 9 AM."
          className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_internal"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="is_internal" className="text-xs text-slate-600 font-medium">
            Internal note (only visible to administrators and maintenance staff)
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Saving Changes...' : 'Save Triage & Broadcast Update'}
        </button>
      </div>
    </form>
  );
}
