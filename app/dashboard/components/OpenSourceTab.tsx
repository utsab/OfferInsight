'use client';

import { useState, useEffect, useMemo } from 'react';
import { getApiHeaders } from '@/app/lib/api-helpers';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OpenSourceEntry, OpenSourceColumnId, BoardTimeFilter, OpenSourceStatus } from './types';
import { openSourceStatusToColumn } from './types';
import { DroppableColumn, formatModalDate, toLocalDateString, LockTooltip } from './shared';
import typesData from '@/partnerships/types.json';

// ===== DATE FIELD EDITING TOGGLE START =====
const ENABLE_DATE_FIELD_EDITING = false;
// ===== DATE FIELD EDITING TOGGLE END =====

type OpenSourceTabProps = {
  filteredOpenSourceColumns: Record<OpenSourceColumnId, OpenSourceEntry[]>;
  openSourceColumns: Record<OpenSourceColumnId, OpenSourceEntry[]>;
  setOpenSourceColumns: React.Dispatch<React.SetStateAction<Record<OpenSourceColumnId, OpenSourceEntry[]>>>;
  isLoading: boolean;
  openSourceFilter: BoardTimeFilter;
  setOpenSourceFilter: (filter: BoardTimeFilter) => void;
  setIsModalOpen: (open: boolean) => void;
  setEditingEntry: (entry: OpenSourceEntry | null) => void;
  sensors: any;
  handleOpenSourceDragStart: (event: any) => void;
  handleOpenSourceDragOver: (event: any) => void;
  handleOpenSourceDragEnd: (event: any) => void;
  activeOpenSourceId: string | null;
  getOpenSourceColumnOfItem: (id: string) => OpenSourceColumnId | null;
  isModalOpen: boolean;
  editingEntry: OpenSourceEntry | null;
  fetchOpenSourceEntries: () => Promise<void>;
  userIdParam: string | null;
  selectedPartnership: string | null;
  setSelectedPartnership: (name: string | null) => void;
  selectedPartnershipId: number | null;
  setSelectedPartnershipId: (id: number | null) => void;
  activePartnershipDbId: number | null;
  setActivePartnershipDbId: (id: number | null) => void;
  activePartnershipCriteria: any[];
  setActivePartnershipCriteria: (criteria: any[]) => void;
  availablePartnerships: Array<{ id: number; name: string; spotsRemaining: number; criteria?: any[] }>;
  fullPartnerships: Array<{ id: number; name: string; criteria?: any[] }>;
  isLoadingPartnerships: boolean;
  fetchAvailablePartnerships: () => Promise<void>;
  isInstructor?: boolean;
};

function SortableOpenSourceCard(props: { 
  card: OpenSourceEntry;
  activeOpenSourceId: string | null;
  setEditingEntry: (entry: OpenSourceEntry) => void;
  setIsModalOpen: (open: boolean) => void;
  isDraggingOpenSourceRef: React.MutableRefObject<boolean>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(props.card.id) });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : undefined,
  } as React.CSSProperties;

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging || props.isDraggingOpenSourceRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (props.activeOpenSourceId === String(props.card.id)) {
      return;
    }
    setTimeout(() => {
      if (!props.isDraggingOpenSourceRef.current && !isDragging && props.activeOpenSourceId !== String(props.card.id)) {
        props.setEditingEntry(props.card);
        props.setIsModalOpen(true);
      }
    }, 50);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={{ ...style, touchAction: 'none' }} 
      {...attributes} 
      {...listeners}
      onClick={handleClick}
      className="bg-gray-600 border border-light-steel-blue rounded-lg p-3 cursor-pointer hover:border-electric-blue transition-colors group relative"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="text-white font-medium mb-1">{props.card.metric || 'Untitled'}</div>
          {props.card.selectedExtras && (props.card.selectedExtras as string[]).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 font-bold uppercase tracking-wider">
                +{(props.card.selectedExtras as string[]).length} Extra{(props.card.selectedExtras as string[]).length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// OpenSource Modal Component
function OpenSourceModal({ 
  entry, 
  onClose, 
  onSave,
  selectedPartnership,
  activePartnershipCriteria,
  availablePartnerships,
  fullPartnerships
}: { 
  entry: OpenSourceEntry | null; 
  onClose: () => void; 
  onSave: (data: Partial<OpenSourceEntry>) => void;
  selectedPartnership: string | null;
  activePartnershipCriteria: any[];
  availablePartnerships: Array<{ id: number; name: string; spotsRemaining: number; criteria?: any[] }>;
  fullPartnerships: Array<{ id: number; name: string; criteria?: any[] }>;
}) {

  type OpenSourceFormData = {
    partnershipName: string;
    metric: string;
    status: OpenSourceStatus;
    criteriaType: string;
    selectedExtras: string[];
    planFields: any[];
    planResponses: Record<string, any>;
    babyStepFields: any[];
    babyStepResponses: Record<string, any>;
    proofOfCompletion: any[];
    proofResponses: Record<string, any>;
    dateCreated: string;
    dateModified: string;
  };

  const [formData, setFormData] = useState<OpenSourceFormData>({
    partnershipName: entry?.partnershipName || selectedPartnership || '',
    metric: entry?.metric || '',
    status: entry?.status || 'plan',
    criteriaType: entry?.criteriaType || '',
    selectedExtras: (entry?.selectedExtras as string[]) || [],
    planFields: entry?.planFields || [],
    planResponses: entry?.planResponses || {},
    babyStepFields: entry?.babyStepFields || [],
    babyStepResponses: entry?.babyStepResponses || {},
    proofOfCompletion: entry?.proofOfCompletion || [],
    proofResponses: entry?.proofResponses || {},
    dateCreated: entry?.dateCreated ? toLocalDateString(entry.dateCreated) : '',
    dateModified: entry?.dateModified ? toLocalDateString(entry.dateModified) : '',
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        partnershipName: entry.partnershipName || '',
        metric: entry.metric || '',
        status: entry.status ?? 'plan',
        criteriaType: entry.criteriaType || '',
        selectedExtras: (entry.selectedExtras as string[]) || [],
        planFields: entry.planFields || [],
        planResponses: entry.planResponses || {},
        babyStepFields: entry.babyStepFields || [],
        babyStepResponses: entry.babyStepResponses || {},
        proofOfCompletion: entry.proofOfCompletion || [],
        proofResponses: entry.proofResponses || {},
        dateCreated: entry.dateCreated ? toLocalDateString(entry.dateCreated) : '',
        dateModified: entry.dateModified ? toLocalDateString(entry.dateModified) : '',
      });
    } else {
      setFormData({
        partnershipName: selectedPartnership || '',
        metric: '',
        status: 'plan',
        criteriaType: '',
        selectedExtras: [],
        planFields: [],
        planResponses: {},
        babyStepFields: [],
        babyStepResponses: {},
        proofOfCompletion: [],
        proofResponses: {},
        dateCreated: '',
        dateModified: '',
      });
    }
  }, [entry, selectedPartnership]);

  const handleProofResponseChange = (text: string, value: any, targetStatus?: OpenSourceStatus) => {
    const status = targetStatus || formData.status;
    setFormData(prev => {
      if (status === 'plan') {
        return {
          ...prev,
          planResponses: { ...prev.planResponses, [text]: value }
        };
      } else if (status === 'babyStep') {
        return {
          ...prev,
          babyStepResponses: { ...prev.babyStepResponses, [text]: value }
        };
      } else {
        return {
          ...prev,
          proofResponses: { ...prev.proofResponses, [text]: value }
        };
      }
    });
  };


  // Helper to get effective fields including extras
  const getEffectiveFields = () => {
    let effectiveBabySteps = [...formData.babyStepFields];
    let effectiveProofOfWork = [...formData.proofOfCompletion];
    let effectivePlan = [...formData.planFields];

    if (formData.criteriaType === 'issue') {
      formData.selectedExtras.forEach(extraType => {
        const extraCriteria = activePartnershipCriteria.find(c => c.type === extraType);
        if (extraCriteria) {
          if (extraCriteria.baby_step_column_fields) {
            effectiveBabySteps = [...effectiveBabySteps, ...extraCriteria.baby_step_column_fields];
          }
          if (extraCriteria.proof_of_completion) {
            effectiveProofOfWork = [...effectiveProofOfWork, ...extraCriteria.proof_of_completion];
          }
          if (extraCriteria.plan_column_fields) {
            effectivePlan = [...effectivePlan, ...extraCriteria.plan_column_fields];
          }
        }
      });
    }

    return { 
      babySteps: effectiveBabySteps, 
      proofOfWork: effectiveProofOfWork,
      plan: effectivePlan
    };
  };

  // Helper to get grouped baby steps
  const getBabyStepGroups = () => {
    const groups: Array<{ name: string; fields: any[] }> = [];
    
    // Add primary baby steps if any
    if (formData.babyStepFields && formData.babyStepFields.length > 0) {
      const primaryType = activePartnershipCriteria.find(c => c.type === formData.criteriaType);
      groups.push({
        name: primaryType?.short_name || formData.criteriaType || 'issue',
        fields: formData.babyStepFields
      });
    }

    // Add extra baby steps
    if (formData.criteriaType === 'issue') {
      formData.selectedExtras.forEach(extraType => {
        const extraCriteria = activePartnershipCriteria.find(c => c.type === extraType);
        if (extraCriteria && extraCriteria.baby_step_column_fields && extraCriteria.baby_step_column_fields.length > 0) {
          groups.push({
            name: extraCriteria.short_name || extraType,
            fields: extraCriteria.baby_step_column_fields
          });
        }
      });
    }
    
    return groups;
  };

  const { babySteps: effectiveBabySteps, proofOfWork: effectiveProofOfWork, plan: effectivePlan } = getEffectiveFields();
  const babyStepGroups = useMemo(() => getBabyStepGroups(), [formData.babyStepFields, formData.criteriaType, formData.selectedExtras, activePartnershipCriteria]);

  // Initialize collapsed sections state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Reset collapsed sections when entry, status, extras, or baby step groups change
  // Collapse sections that are not relevant to current column
  // Use a single computed dependency to ensure stable array size
  const collapseDeps = useMemo(() => {
    return `${entry?.id ?? 'new'}-${formData.status}-${formData.selectedExtras.length}-${formData.criteriaType ?? ''}-${babyStepGroups.length}`;
  }, [entry?.id, formData.status, formData.selectedExtras.length, formData.criteriaType, babyStepGroups.length]);
  
  useEffect(() => {
    const newState: Record<string, boolean> = {
      plan: formData.status !== 'plan', // Collapsed if not in plan column
      proofOfWork: formData.status === 'babyStep', // Collapsed if in babyStep column
      extras: formData.status !== 'plan', // Collapsed if not in plan column
    };
    // Initialize for each baby step group - collapse if not in babyStep or plan column
    babyStepGroups.forEach((_, idx) => {
      newState[`babyStep-${idx}`] = formData.status !== 'babyStep' && formData.status !== 'plan';
    });
    setCollapsedSections(newState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapseDeps]);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderProofField = (requirement: any, index: number, forcedStatus?: OpenSourceStatus, disabled?: boolean) => {
    const status = forcedStatus || formData.status;
    let value = '';
    if (status === 'plan') {
      value = formData.planResponses[requirement.text] || '';
    } else if (status === 'babyStep') {
      value = formData.babyStepResponses[requirement.text] || '';
    } else {
      value = formData.proofResponses[requirement.text] || '';
    }

    return (
      <div key={index} className="space-y-2">
        <div className="flex justify-between items-center gap-4">
          <label className="block text-white font-semibold">{requirement.text}</label>
          {requirement.helper_video && (
            <a 
              href={requirement.helper_video} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-electric-blue hover:underline text-xs whitespace-nowrap"
            >
              Watch Helper Video
            </a>
          )}
        </div>
        {requirement.type === 'URL' && (
          <input
            type="url"
            value={value}
            onChange={(e) => handleProofResponseChange(requirement.text, e.target.value, forcedStatus)}
            disabled={disabled}
            className={`w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            placeholder="https://..."
          />
        )}
        {(requirement.type === 'Checkbox' || requirement.type === 'checkbox') && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleProofResponseChange(requirement.text, e.target.checked, forcedStatus)}
              disabled={disabled}
              className={`w-5 h-5 rounded border-light-steel-blue bg-gray-700 text-electric-blue focus:ring-electric-blue ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            />
            <span className="text-gray-300">Done</span>
          </div>
        )}
        {requirement.type === 'text' && (
          <textarea
            value={value}
            onChange={(e) => handleProofResponseChange(requirement.text, e.target.value, forcedStatus)}
            disabled={disabled}
            className={`w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white placeholder-gray-400 min-h-[80px] ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            placeholder="Write your response here..."
          />
        )}
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partnershipName.trim()) {
      alert('Partnership name is required');
      return;
    }
    if (!formData.metric.trim()) {
      alert('Metric is required');
      return;
    }
    
    // Recalculate fields based on current selectedExtras before saving
    // This ensures fields array includes all extra fields when extras are changed
    let effectiveBabySteps = [...formData.babyStepFields];
    let effectiveProofOfWork = [...formData.proofOfCompletion];
    let effectivePlan = [...formData.planFields];

    if (formData.criteriaType === 'issue') {
      formData.selectedExtras.forEach(extraType => {
        const extraCriteria = activePartnershipCriteria.find(c => c.type === extraType);
        if (extraCriteria) {
          if (extraCriteria.baby_step_column_fields) {
            effectiveBabySteps = [...effectiveBabySteps, ...extraCriteria.baby_step_column_fields];
          }
          if (extraCriteria.proof_of_completion) {
            effectiveProofOfWork = [...effectiveProofOfWork, ...extraCriteria.proof_of_completion];
          }
          if (extraCriteria.plan_column_fields) {
            effectivePlan = [...effectivePlan, ...extraCriteria.plan_column_fields];
          }
        }
      });
    }
    
    // Collect all valid field text keys to clean up orphaned responses
    const validPlanKeys = new Set(effectivePlan.map(f => f.text).filter(Boolean));
    const validBabyStepKeys = new Set(effectiveBabySteps.map(f => f.text).filter(Boolean));
    const validProofKeys = new Set(effectiveProofOfWork.map(f => f.text).filter(Boolean));
    
    // Clean up responses to only include keys for fields that still exist
    const cleanedPlanResponses: Record<string, any> = {};
    const cleanedBabyStepResponses: Record<string, any> = {};
    const cleanedProofResponses: Record<string, any> = {};
    
    Object.keys(formData.planResponses).forEach(key => {
      if (validPlanKeys.has(key)) {
        cleanedPlanResponses[key] = formData.planResponses[key];
      }
    });
    
    Object.keys(formData.babyStepResponses).forEach(key => {
      if (validBabyStepKeys.has(key)) {
        cleanedBabyStepResponses[key] = formData.babyStepResponses[key];
      }
    });
    
    Object.keys(formData.proofResponses).forEach(key => {
      if (validProofKeys.has(key)) {
        cleanedProofResponses[key] = formData.proofResponses[key];
      }
    });
    
    const { dateCreated, dateModified, ...restFormData } = formData;
    const submitData: Partial<OpenSourceEntry> = { 
      ...restFormData,
      // Update fields to reflect current selectedExtras
      planFields: effectivePlan,
      babyStepFields: effectiveBabySteps,
      proofOfCompletion: effectiveProofOfWork,
      // Clean up responses to remove orphaned data from removed extras
      planResponses: cleanedPlanResponses,
      babyStepResponses: cleanedBabyStepResponses,
      proofResponses: cleanedProofResponses,
    };
    if (ENABLE_DATE_FIELD_EDITING) {
      if (dateCreated) {
        try {
          const date = new Date(dateCreated);
          if (!isNaN(date.getTime())) {
            submitData.dateCreated = date.toISOString();
          }
        } catch (error) {
          console.error('Error parsing dateCreated:', error);
        }
      }
      if (dateModified !== undefined) {
        try {
          if (dateModified) {
            const date = new Date(dateModified);
            if (!isNaN(date.getTime())) {
              submitData.dateModified = date.toISOString();
            }
          } else {
            submitData.dateModified = null;
          }
        } catch (error) {
          console.error('Error parsing dateModified:', error);
        }
      }
    }
    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            {entry ? 'Edit Open Source Criteria' : 'Create New Open Source Criteria'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2">Metric</label>
            <div className="w-full bg-gray-700/50 border border-light-steel-blue/30 rounded-lg px-4 py-3 text-gray-300 italic">
              <div className={formData.criteriaType === 'issue' && formData.selectedExtras.length > 0 ? 'pb-2 border-b border-gray-600 mb-2 font-medium text-white' : ''}>
                {formData.metric || 'No metric defined'}
              </div>
              {formData.criteriaType === 'issue' && formData.selectedExtras.map(extraType => {
                const extra = activePartnershipCriteria.find(c => c.type === extraType);
                return extra ? (
                  <div key={extraType} className="text-sm flex gap-2 items-start py-1">
                    <span className="text-electric-blue text-[10px] font-bold uppercase mt-1 shrink-0">Extra:</span>
                    <span>
                      {extra.metric || extraType}
                    </span>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* Extras selection - Visible in all columns, collapsible, only for 'issue' type cards */}
          {formData.criteriaType === 'issue' && activePartnershipCriteria.some(c => !c.is_primary && c.type !== 'multiple_choice') && (
            <div className="bg-gray-700/50 rounded-lg border border-light-steel-blue/30 my-6">
              <button
                type="button"
                onClick={() => toggleSection('extras')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-600/50 transition-colors rounded-t-lg"
              >
                <div className="flex flex-col items-start">
                  <label className="block text-white font-semibold text-sm">Knock two birds with one stone</label>
                  <p className="text-xs text-gray-400 italic">Select additional requirements you plan to complete while working on the issue.</p>
                </div>
                {collapsedSections.extras ? (
                  <ChevronDown className="w-4 h-4 text-electric-blue flex-shrink-0 ml-4" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-electric-blue flex-shrink-0 ml-4" />
                )}
              </button>
              {!collapsedSections.extras && (
                <div className="space-y-3 p-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    {activePartnershipCriteria.filter(c => !c.is_primary && c.type !== 'multiple_choice').map(extra => (
                      <label key={extra.type} className="flex items-center gap-3 p-2 hover:bg-gray-600 rounded cursor-pointer transition-colors border border-transparent hover:border-light-steel-blue/20">
                        <input
                          type="checkbox"
                          checked={formData.selectedExtras.includes(extra.type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                selectedExtras: [...prev.selectedExtras, extra.type]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                selectedExtras: prev.selectedExtras.filter(t => t !== extra.type)
                              }));
                            }
                          }}
                          className="w-4 h-4 rounded border-light-steel-blue bg-gray-700 text-electric-blue focus:ring-electric-blue"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-200">
                            {extra.metric || extra.type}
                          </span>
                          <span className="text-[10px] text-gray-400 italic">
                            {extra.quality || 'Extra Goal'}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Baby Step Requirements - Visible in all columns, blurred in plan, always editable */}
          {babyStepGroups.length > 0 && (
            <div className="relative group space-y-4">
              {babyStepGroups.map((group, gIdx) => {
                const sectionKey = `babyStep-${gIdx}`;
                const isCollapsed = collapsedSections[sectionKey] || false;
                const isBlurred = formData.status === 'plan';
                return (
                  <div key={gIdx} className={`${isBlurred ? 'blur-sm' : ''} bg-gray-700/30 rounded-lg border border-gray-600`}>
                    <button
                      type="button"
                      onClick={() => toggleSection(sectionKey)}
                      className="w-full flex items-center justify-between p-4 transition-colors rounded-t-lg hover:bg-gray-600/50"
                    >
                      <h4 className="text-electric-blue font-bold uppercase tracking-wider text-xs">
                        Baby Step for {group.name}
                      </h4>
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-electric-blue" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-electric-blue" />
                      )}
                    </button>
                    {!isCollapsed && (
                      <div className="space-y-6 px-4 pb-4">
                        {group.fields.map((req, index) => renderProofField(req, index, 'babyStep', false))}
                      </div>
                    )}
                  </div>
                );
              })}
              {formData.status === 'plan' && <LockTooltip />}
            </div>
          )}

          {/* Plan Column Fields - Visible in all columns, blurred when not in plan, always editable */}
          {effectivePlan.length > 0 && (
            <div className="border-y border-gray-700 py-6 my-6">
              <button
                type="button"
                onClick={() => toggleSection('plan')}
                className="w-full flex items-center justify-between hover:bg-gray-700/50 transition-colors rounded-lg p-2 -m-2"
              >
                <h4 className={`text-electric-blue font-bold flex items-center gap-2 text-xs uppercase tracking-wider ${formData.status !== 'plan' ? 'blur-sm' : ''}`}>
                  Plan
                </h4>
                {collapsedSections.plan ? (
                  <ChevronDown className="w-4 h-4 text-electric-blue" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-electric-blue" />
                )}
              </button>
              {!collapsedSections.plan && (
                <div className={`space-y-6 mt-4 ${formData.status !== 'plan' ? 'blur-sm' : ''}`}>
                  {effectivePlan.map((req, index) => renderProofField(req, index, 'plan', false))}
                </div>
              )}
            </div>
          )}

          {/* Proof of Work Fields - Visible in babyStep/inProgress/done, blurred/disabled in babyStep, editable in inProgress/done */}
          {effectiveProofOfWork.length > 0 && formData.status !== 'plan' && (
            <div className="relative group border-y border-gray-700 py-6 my-6">
              <button
                type="button"
                onClick={() => formData.status !== 'babyStep' && toggleSection('proofOfWork')}
                disabled={formData.status === 'babyStep'}
                className={`w-full flex items-center justify-between transition-colors rounded-lg p-2 -m-2 ${formData.status === 'babyStep' ? 'pointer-events-none cursor-not-allowed' : 'hover:bg-gray-700/50'}`}
              >
                <h4 className={`text-electric-blue font-bold flex items-center gap-2 text-xs uppercase tracking-wider ${formData.status === 'babyStep' ? 'blur-sm' : ''}`}>
                  Proof of Work
                </h4>
                {formData.status !== 'babyStep' && (
                  collapsedSections.proofOfWork ? (
                    <ChevronDown className="w-4 h-4 text-electric-blue" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-electric-blue" />
                  )
                )}
              </button>
              {!collapsedSections.proofOfWork && (
                <div className={`${formData.status === 'babyStep' ? 'blur-sm pointer-events-none' : ''} space-y-6 mt-4`}>
                  {effectiveProofOfWork.map((req, index) => renderProofField(req, index, undefined, formData.status === 'babyStep'))}
                </div>
              )}
              {formData.status === 'babyStep' && <LockTooltip />}
            </div>
          )}


          {ENABLE_DATE_FIELD_EDITING && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">Date Created (Testing/Debug)</label>
                <input
                  type="date"
                  value={formData.dateCreated}
                  onChange={(e) => setFormData({ ...formData, dateCreated: e.target.value })}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Date Modified (Testing/Debug)</label>
                <input
                  type="date"
                  value={formData.dateModified}
                  onChange={(e) => setFormData({ ...formData, dateModified: e.target.value })}
                  className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          )}

          {entry && (
            <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <span>Created: {formatModalDate(entry.dateCreated)}</span>
                <span>Modified: {formatModalDate(entry.dateModified)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-electric-blue hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
              >
                {entry ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper function to convert snake_case or camelCase to proper display name
const formatDisplayName = (name: string): string => {
  return name
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function OpenSourceTab({
  filteredOpenSourceColumns,
  openSourceColumns,
  setOpenSourceColumns,
  isLoading,
  openSourceFilter,
  setOpenSourceFilter,
  setIsModalOpen,
  setEditingEntry,
  sensors,
  handleOpenSourceDragStart,
  handleOpenSourceDragOver,
  handleOpenSourceDragEnd,
  activeOpenSourceId,
  getOpenSourceColumnOfItem,
  isModalOpen,
  editingEntry,
  fetchOpenSourceEntries,
  isDraggingOpenSourceRef,
  userIdParam,
  selectedPartnership,
  setSelectedPartnership,
  selectedPartnershipId,
  setSelectedPartnershipId,
  activePartnershipDbId,
  setActivePartnershipDbId,
  activePartnershipCriteria,
  setActivePartnershipCriteria,
  availablePartnerships,
  fullPartnerships,
  isLoadingPartnerships,
  fetchAvailablePartnerships,
  isInstructor = false,
}: OpenSourceTabProps & { isDraggingOpenSourceRef: React.MutableRefObject<boolean> }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasSavedSelection, setHasSavedSelection] = useState(selectedPartnership !== null);
  const [tempSelection, setTempSelection] = useState<string | null>(selectedPartnership);
  const [multipleChoiceSelections, setMultipleChoiceSelections] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSwitchConfirmation, setShowSwitchConfirmation] = useState(false);
  const [showAbandonConfirmation, setShowAbandonConfirmation] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);

  // Reset saved state when selectedPartnership changes externally to null
  useEffect(() => {
    if (selectedPartnership === null) {
      setHasSavedSelection(false);
      setTempSelection(null);
    } else {
      setHasSavedSelection(true);
      setTempSelection(selectedPartnership);
    }
  }, [selectedPartnership]);

  const handleSaveSelection = async () => {
    if (tempSelection === null || isSaving) return;

    const selectedPartnershipData = availablePartnerships.find(p => p.name === tempSelection);
    if (!selectedPartnershipData) return;

    // If instructor is switching partnerships, show confirmation
    if (isInstructor && userIdParam && selectedPartnership && tempSelection !== selectedPartnership) {
      setShowSwitchConfirmation(true);
      return;
    }

    await performSaveSelection();
  };

  const performSaveSelection = async () => {
    if (tempSelection === null || isSaving) return;

    const selectedPartnershipData = availablePartnerships.find(p => p.name === tempSelection);
    if (!selectedPartnershipData) return;

    setIsSaving(true);
    try {
      const url = userIdParam ? `/api/users/partnership?userId=${userIdParam}` : '/api/users/partnership';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnershipId: selectedPartnershipData.id,
          multipleChoiceSelections,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to save partnership');
        return;
      }

      const data = await response.json();
      setSelectedPartnership(tempSelection);
      setSelectedPartnershipId(selectedPartnershipData.id);
      setActivePartnershipDbId(data.id);
      setActivePartnershipCriteria(data.criteria || []);
      setHasSavedSelection(true);
      setIsDropdownOpen(false);
      setShowSwitchConfirmation(false);
      // Refresh available partnerships to update spots remaining
      fetchAvailablePartnerships();
      // Refresh open source entries to show the auto-generated cards
      fetchOpenSourceEntries();
    } catch (error) {
      console.error('Error saving partnership:', error);
      alert('Failed to save partnership. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAbandonPartnership = async () => {
    if (!isInstructor || !userIdParam || !activePartnershipDbId) return;

    setIsAbandoning(true);
    try {
      const url = `/api/users/partnership?userId=${userIdParam}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to abandon partnership');
        return;
      }

      // Reset all partnership-related state
      setSelectedPartnership(null);
      setSelectedPartnershipId(null);
      setActivePartnershipDbId(null);
      setActivePartnershipCriteria([]);
      setHasSavedSelection(false);
      setTempSelection(null);
      setShowAbandonConfirmation(false);
      
      // Refresh available partnerships and entries
      fetchAvailablePartnerships();
      fetchOpenSourceEntries();
    } catch (error) {
      console.error('Error abandoning partnership:', error);
      alert('Failed to abandon partnership. Please try again.');
    } finally {
      setIsAbandoning(false);
    }
  };

  return (
    <section className="bg-gray-800 border border-light-steel-blue rounded-lg p-4 sm:p-6">
      {hasSavedSelection && (
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4 mb-6">
          <h4 className="text-xl font-bold text-white">Open Source Contributions</h4>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span>Show:</span>
            <button
              onClick={() => setOpenSourceFilter('modifiedThisMonth')}
              className={`px-3 py-1 rounded-md border transition-colors ${
                openSourceFilter === 'modifiedThisMonth'
                  ? 'bg-electric-blue text-white border-electric-blue'
                  : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setOpenSourceFilter('allTime')}
              className={`px-3 py-1 rounded-md border transition-colors ${
                openSourceFilter === 'allTime'
                  ? 'bg-electric-blue text-white border-electric-blue'
                  : 'bg-gray-700 text-gray-300 border-transparent hover:border-light-steel-blue'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      )}

      {/* Show centered dropdown when no selection has been saved */}
      {!hasSavedSelection ? (
        <div className="flex flex-col items-center justify-center py-16 min-h-[400px]">
          <div className="w-full max-w-md">
            <label className="block text-white font-semibold mb-4 text-center text-2xl">Choose Partnership Agreement</label>
            <div className="relative mb-6">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-3 text-white flex items-center justify-between hover:border-electric-blue transition-colors"
              >
                <span>{tempSelection || '<none selected>'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute z-20 mt-1 w-full bg-gray-700 border border-light-steel-blue rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        setTempSelection(null);
                        setMultipleChoiceSelections({});
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-600 transition-colors ${
                        tempSelection === null ? 'bg-gray-600 text-electric-blue' : 'text-white'
                      }`}
                    >
                      &lt;none selected&gt;
                    </button>
                    {availablePartnerships.map(partnership => (
                      <button
                        key={partnership.id}
                        onClick={() => {
                          setTempSelection(partnership.name);
                          setMultipleChoiceSelections({});
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-600 transition-colors ${
                          tempSelection === partnership.name ? 'bg-gray-600 text-electric-blue' : 'text-white'
                        }`}
                      >
                        <span>{partnership.name}</span>
                        <span className="text-gray-400 text-sm ml-2">({partnership.spotsRemaining} spot{partnership.spotsRemaining !== 1 ? 's' : ''} left)</span>
                      </button>
                    ))}
                    {fullPartnerships.map(partnership => (
                      <div
                        key={partnership.id}
                        className="w-full text-left px-4 py-2 text-gray-500 cursor-not-allowed"
                      >
                        <span>{partnership.name}</span>
                        <span className="text-gray-600 text-sm ml-2">(Not available)</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Multiple Choice Selection */}
            {tempSelection && (() => {
              const selectedP = availablePartnerships.find(p => p.name === tempSelection);
              if (!selectedP) return null;
              const mcBlocks = selectedP.criteria?.filter(c => c.type === 'multiple_choice') || [];
              if (mcBlocks.length === 0) return null;

              return (
                <div className="space-y-4 mt-6 p-4 bg-gray-700/50 rounded-lg border border-light-steel-blue/30">
                  <p className="text-white font-semibold text-sm mb-2 italic">This partnership requires some additional choices:</p>
                  {mcBlocks.map((block, idx) => (
                    <div key={idx} className="space-y-2">
                      <label className="block text-electric-blue text-xs uppercase tracking-wider font-bold">
                        {block.quality}
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {block.choices.map((choice: any) => (
                          <button
                            key={choice.type}
                            onClick={() => setMultipleChoiceSelections(prev => ({
                              ...prev,
                              [idx]: choice.type
                            }))}
                            className={`text-left px-3 py-2 rounded border transition-colors text-sm ${
                              multipleChoiceSelections[idx] === choice.type
                                ? 'bg-electric-blue border-electric-blue text-white'
                                : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-light-steel-blue'
                            }`}
                          >
                            <div className="font-medium">{choice.label}</div>
                            {choice.quality && <div className={`text-[10px] ${multipleChoiceSelections[idx] === choice.type ? 'text-blue-100' : 'text-gray-400'}`}>{choice.quality}</div>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            <button
              onClick={handleSaveSelection}
              disabled={tempSelection === null || isSaving || (() => {
                const selectedP = availablePartnerships.find(p => p.name === tempSelection);
                if (!selectedP) return false;
                const mcBlocks = selectedP.criteria?.filter(c => c.type === 'multiple_choice') || [];
                return mcBlocks.some((_, idx) => !multipleChoiceSelections[idx]);
              })()}
              className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors mt-6 ${
                tempSelection === null || isSaving || (() => {
                  const selectedP = availablePartnerships.find(p => p.name === tempSelection);
                  if (!selectedP) return false;
                  const mcBlocks = selectedP.criteria?.filter(c => c.type === 'multiple_choice') || [];
                  return mcBlocks.some((_, idx) => !multipleChoiceSelections[idx]);
                })()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-electric-blue hover:bg-blue-600 text-white'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Selection'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Instructor Partnership Selector - Show at top when instructor is viewing */}
          {isInstructor && userIdParam && (
            <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-light-steel-blue/30">
              <label className="block text-white font-semibold mb-3 text-sm">Select Partnership for Student</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full max-w-md bg-gray-700 border border-light-steel-blue rounded-lg px-4 py-3 text-white flex items-center justify-between hover:border-electric-blue transition-colors"
                >
                  <span>{tempSelection || selectedPartnership || '<none selected>'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute z-20 mt-1 w-full max-w-md bg-gray-700 border border-light-steel-blue rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <button
                        onClick={() => {
                          setTempSelection(null);
                          setMultipleChoiceSelections({});
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-600 transition-colors ${
                          (tempSelection || selectedPartnership) === null ? 'bg-gray-600 text-electric-blue' : 'text-white'
                        }`}
                      >
                        &lt;none selected&gt;
                      </button>
                      {availablePartnerships.map(partnership => (
                        <button
                          key={partnership.id}
                          onClick={() => {
                            setTempSelection(partnership.name);
                            setMultipleChoiceSelections({});
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-600 transition-colors ${
                            (tempSelection || selectedPartnership) === partnership.name ? 'bg-gray-600 text-electric-blue' : 'text-white'
                          }`}
                        >
                          <span>{partnership.name}</span>
                          <span className="text-gray-400 text-sm ml-2">({partnership.spotsRemaining} spot{partnership.spotsRemaining !== 1 ? 's' : ''} left)</span>
                        </button>
                      ))}
                      {fullPartnerships.map(partnership => (
                        <div
                          key={partnership.id}
                          className="w-full text-left px-4 py-2 text-gray-500 cursor-not-allowed"
                        >
                          <span>{partnership.name}</span>
                          <span className="text-gray-600 text-sm ml-2">(Not available)</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* Multiple Choice Selection for Instructor */}
              {(tempSelection || selectedPartnership) && (() => {
                const selectedP = availablePartnerships.find(p => p.name === (tempSelection || selectedPartnership));
                if (!selectedP) return null;
                const mcBlocks = selectedP.criteria?.filter(c => c.type === 'multiple_choice') || [];
                if (mcBlocks.length === 0) return null;

                return (
                  <div className="space-y-4 mt-4 p-4 bg-gray-700/50 rounded-lg border border-light-steel-blue/30">
                    <p className="text-white font-semibold text-sm mb-2 italic">This partnership requires some additional choices:</p>
                    {mcBlocks.map((block, idx) => (
                      <div key={idx} className="space-y-2">
                        <label className="block text-electric-blue text-xs uppercase tracking-wider font-bold">
                          {block.quality}
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          {block.choices.map((choice: any) => (
                            <button
                              key={choice.type}
                              onClick={() => setMultipleChoiceSelections(prev => ({
                                ...prev,
                                [idx]: choice.type
                              }))}
                              className={`text-left px-3 py-2 rounded border transition-colors text-sm ${
                                multipleChoiceSelections[idx] === choice.type
                                  ? 'bg-electric-blue border-electric-blue text-white'
                                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-light-steel-blue'
                              }`}
                            >
                              <div className="font-medium">{choice.label}</div>
                              {choice.quality && <div className={`text-[10px] ${multipleChoiceSelections[idx] === choice.type ? 'text-blue-100' : 'text-gray-400'}`}>{choice.quality}</div>}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Save Button for Instructor */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleSaveSelection}
                  disabled={
                    isSaving ||
                    tempSelection === null ||
                    tempSelection === selectedPartnership ||
                    (() => {
                      const selectedP = availablePartnerships.find(p => p.name === tempSelection);
                      if (!selectedP) return false;
                      const mcBlocks = selectedP.criteria?.filter(c => c.type === 'multiple_choice') || [];
                      return mcBlocks.some((_, idx) => !multipleChoiceSelections[idx]);
                    })()
                  }
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isSaving ||
                    tempSelection === null ||
                    tempSelection === selectedPartnership ||
                    (() => {
                      const selectedP = availablePartnerships.find(p => p.name === tempSelection);
                      if (!selectedP) return false;
                      const mcBlocks = selectedP.criteria?.filter(c => c.type === 'multiple_choice') || [];
                      return mcBlocks.some((_, idx) => !multipleChoiceSelections[idx]);
                    })()
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-electric-blue hover:bg-blue-600 text-white'
                  }`}
                >
                  {isSaving ? 'Saving...' : tempSelection !== selectedPartnership ? 'Switch Partnership' : 'Save Partnership Selection'}
                </button>
                
                {/* Abandon Partnership Button */}
                {selectedPartnership && (
                  <button
                    onClick={() => setShowAbandonConfirmation(true)}
                    disabled={isAbandoning || isSaving}
                    className="px-4 py-2 rounded-lg font-semibold transition-colors bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {isAbandoning ? 'Abandoning...' : 'Abandon Partnership'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Switch Partnership Confirmation Modal */}
          {showSwitchConfirmation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSwitchConfirmation(false)}>
              <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-4">Switch Partnership</h3>
                <p className="text-gray-300 mb-2">
                  Are you sure you want to switch from <span className="font-semibold text-white">{selectedPartnership}</span> to <span className="font-semibold text-white">{tempSelection}</span>?
                </p>
                <p className="text-red-400 text-sm mb-6 font-semibold">
                  ⚠️ This will delete ALL existing cards and reset all progress for this student. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowSwitchConfirmation(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={performSaveSelection}
                    disabled={isSaving}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Switching...' : 'Yes, Switch Partnership'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Abandon Partnership Confirmation Modal */}
          {showAbandonConfirmation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAbandonConfirmation(false)}>
              <div className="bg-gray-800 border border-light-steel-blue rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-4">Abandon Partnership</h3>
                <p className="text-gray-300 mb-2">
                  Are you sure you want to abandon <span className="font-semibold text-white">{selectedPartnership}</span> for this student?
                </p>
                <p className="text-red-400 text-sm mb-6 font-semibold">
                  ⚠️ This will delete ALL existing cards and reset all progress. The student will have no active partnership. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowAbandonConfirmation(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAbandonPartnership}
                    disabled={isAbandoning}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {isAbandoning ? 'Abandoning...' : 'Yes, Abandon Partnership'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading open source entries...</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleOpenSourceDragStart} onDragOver={handleOpenSourceDragOver} onDragEnd={handleOpenSourceDragEnd}>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="grid grid-cols-5 gap-3 min-w-[800px] items-stretch">
              <div className="bg-gray-700 rounded-lg p-2 flex flex-col">
                <h5 className="text-white font-semibold mb-4 flex items-center flex-shrink-0">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  Plan ({filteredOpenSourceColumns.plan.length})
                </h5>
                <div className="flex-1 min-h-0">
                <SortableContext items={filteredOpenSourceColumns.plan.map(c => c.id)} strategy={rectSortingStrategy}>
                  <DroppableColumn 
                    id="plan"
                    hasCardsToRight={
                      filteredOpenSourceColumns.babyStep.length > 0 ||
                      filteredOpenSourceColumns.inProgress.length > 0 ||
                      filteredOpenSourceColumns.done.length > 0
                    }
                  >
                    {filteredOpenSourceColumns.plan.map(card => (
                      <SortableOpenSourceCard 
                        key={card.id} 
                        card={card}
                        activeOpenSourceId={activeOpenSourceId}
                        setEditingEntry={setEditingEntry}
                        setIsModalOpen={setIsModalOpen}
                        isDraggingOpenSourceRef={isDraggingOpenSourceRef}
                      />
                    ))}
                  </DroppableColumn>
                </SortableContext>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-2 flex flex-col">
                <h5 className="text-white font-semibold mb-4 flex items-center flex-shrink-0">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  Baby Step ({filteredOpenSourceColumns.babyStep.length})
                </h5>
                <div className="flex-1 min-h-0">
                <SortableContext items={filteredOpenSourceColumns.babyStep.map(c => c.id)} strategy={rectSortingStrategy}>
                  <DroppableColumn 
                    id="babyStep"
                    hasCardsToRight={
                      filteredOpenSourceColumns.inProgress.length > 0 ||
                      filteredOpenSourceColumns.done.length > 0
                    }
                  >
                    {filteredOpenSourceColumns.babyStep.map(card => (
                      <SortableOpenSourceCard 
                        key={card.id} 
                        card={card}
                        activeOpenSourceId={activeOpenSourceId}
                        setEditingEntry={setEditingEntry}
                        setIsModalOpen={setIsModalOpen}
                        isDraggingOpenSourceRef={isDraggingOpenSourceRef}
                      />
                    ))}
                  </DroppableColumn>
                </SortableContext>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-2 flex flex-col">
                <h5 className="text-white font-semibold mb-4 flex items-center flex-shrink-0">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  In Progress ({filteredOpenSourceColumns.inProgress.length})
                </h5>
                <div className="flex-1 min-h-0">
                <SortableContext items={filteredOpenSourceColumns.inProgress.map(c => c.id)} strategy={rectSortingStrategy}>
                  <DroppableColumn 
                    id="inProgress"
                    hasCardsToRight={filteredOpenSourceColumns.done.length > 0}
                  >
                    {filteredOpenSourceColumns.inProgress.map(card => (
                      <SortableOpenSourceCard 
                        key={card.id} 
                        card={card}
                        activeOpenSourceId={activeOpenSourceId}
                        setEditingEntry={setEditingEntry}
                        setIsModalOpen={setIsModalOpen}
                        isDraggingOpenSourceRef={isDraggingOpenSourceRef}
                      />
                    ))}
                  </DroppableColumn>
                </SortableContext>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-2 flex flex-col">
                <h5 className="text-white font-semibold mb-4 flex items-center flex-shrink-0">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Done ({filteredOpenSourceColumns.done.length})
                </h5>
                <div className="flex-1 min-h-0">
                <SortableContext items={filteredOpenSourceColumns.done.map(c => c.id)} strategy={rectSortingStrategy}>
                  <DroppableColumn 
                    id="done"
                    hasCardsToRight={false}
                  >
                    {filteredOpenSourceColumns.done.map(card => (
                      <SortableOpenSourceCard 
                        key={card.id} 
                        card={card}
                        activeOpenSourceId={activeOpenSourceId}
                        setEditingEntry={setEditingEntry}
                        setIsModalOpen={setIsModalOpen}
                        isDraggingOpenSourceRef={isDraggingOpenSourceRef}
                      />
                    ))}
                  </DroppableColumn>
                </SortableContext>
                </div>
              </div>

              {/* Progress Column - Partnership Requirements */}
              <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg p-4 border-2 border-electric-blue/30 shadow-lg flex flex-col h-full">
                <div className="mb-4 pb-3 border-b border-electric-blue/20 flex-shrink-0">
                  <h5 className="text-white font-bold text-lg flex items-center mb-1">
                    <div className="w-4 h-4 bg-electric-blue rounded-full mr-2 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    Partnership Progress
                  </h5>
                  <p className="text-xs text-gray-400 mt-1">{selectedPartnership ? `${selectedPartnership}'s Criteria` : 'Track your requirements'}</p>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto min-h-0">
                  {activePartnershipCriteria && activePartnershipCriteria.length > 0 ? (
                    activePartnershipCriteria.map((criteria: any, index: number) => {
                      // Skip multiple_choice criteria as they're handled separately
                      if (criteria.type === 'multiple_choice') return null;
                      
                      const requiredCount = criteria.count || 1;
                      const allEntries = [
                        ...filteredOpenSourceColumns.plan,
                        ...filteredOpenSourceColumns.babyStep,
                        ...filteredOpenSourceColumns.inProgress,
                        ...filteredOpenSourceColumns.done,
                      ];
                      
                      // Count completed entries for this criteria type
                      // This includes both standalone cards and extras attached to other cards
                      const completedCount = filteredOpenSourceColumns.done.filter(entry => {
                        // Check if this card is directly for this criteria type
                        if (entry.criteriaType === criteria.type) {
                          return true;
                        }
                        // Check if this card has this criteria type as an extra
                        const extras = entry.selectedExtras as string[] | null;
                        if (extras && Array.isArray(extras) && extras.includes(criteria.type)) {
                          return true;
                        }
                        return false;
                      }).length;
                      
                      // Get display name from types.json
                      const typeInfo = (typesData.types as any)[criteria.type];
                      const displayName = typeInfo?.metric || criteria.metric || criteria.type || 'Unknown';
                      const shortName = formatDisplayName(typeInfo?.short_name || criteria.type);
                      
                      const progressPercent = requiredCount > 0 ? (completedCount / requiredCount) * 100 : 0;
                      const isComplete = completedCount >= requiredCount;
                      
                      return (
                        <div key={`${criteria.type}-${index}`} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 hover:border-electric-blue/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white truncate flex-1" title={displayName}>
                              {shortName}
                            </span>
                            <span className={`ml-2 flex-shrink-0 font-bold text-base ${
                              isComplete ? 'text-green-400' : 'text-electric-blue'
                            }`}>
                              {completedCount}/{requiredCount}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full transition-all ${
                                isComplete 
                                  ? 'bg-gradient-to-r from-green-500 to-green-400 shadow-[0_0_8px_rgba(34,197,94,0.4)]' 
                                  : 'bg-gradient-to-r from-electric-blue to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                              }`}
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            />
                          </div>
                          {isComplete && (
                            <div className="mt-1.5 text-xs text-green-400 flex items-center">
                              <span className="mr-1">✓</span>
                              Complete
                            </div>
                          )}
                        </div>
                      );
                    }).filter(Boolean)
                  ) : (
                    <div className="text-center py-8 text-gray-400 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <div className="text-sm mb-1">
                        {selectedPartnership ? (
                          'No requirements defined'
                        ) : (
                          'Select a partnership to see progress'
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Summary stats */}
                  {activePartnershipCriteria && activePartnershipCriteria.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-electric-blue/20">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                          <div className="text-xs text-gray-400 mb-1">Completed</div>
                          <div className="text-2xl font-bold text-green-400">
                            {filteredOpenSourceColumns.done.length}
                          </div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                          <div className="text-xs text-gray-400 mb-1">In Progress</div>
                          <div className="text-2xl font-bold text-purple-400">
                            {filteredOpenSourceColumns.inProgress.length + filteredOpenSourceColumns.babyStep.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DragOverlay style={{ touchAction: 'none' }}>
            {activeOpenSourceId ? (() => {
              const col = getOpenSourceColumnOfItem(activeOpenSourceId);
              if (!col) return null;
              const card = openSourceColumns[col].find(c => String(c.id) === activeOpenSourceId);
              if (!card) return null;
              return (
                <div className="bg-gray-600 border border-light-steel-blue rounded-lg p-3" style={{ touchAction: 'none' }}>
                  <div className="text-white font-medium mb-1">{card.metric || 'Untitled'}</div>
                  <div className="text-gray-400 text-xs mb-1">Partnership: {card.partnershipName}</div>
                </div>
              );
            })() : null}
          </DragOverlay>
        </DndContext>
          )}
        </>
      )}
      
      {/* Create/Edit Modal */}
      {isModalOpen && (
        <OpenSourceModal
          entry={editingEntry}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEntry(null);
          }}
          onSave={async (data: Partial<OpenSourceEntry>) => {
            try {
              const url = userIdParam ? `/api/open_source?userId=${userIdParam}` : '/api/open_source';
              let updatedEntry: OpenSourceEntry;
              if (editingEntry) {
                const response = await fetch(url, {
                  method: 'PUT',
                  headers: getApiHeaders(),
                  body: JSON.stringify({ ...data, id: editingEntry.id }),
                });
                if (!response.ok) throw new Error('Failed to update open source criteria');
                updatedEntry = await response.json() as OpenSourceEntry;
                
                setOpenSourceColumns(prev => {
                  const newColumns: Record<OpenSourceColumnId, OpenSourceEntry[]> = {
                    plan: [...prev.plan],
                    babyStep: [...prev.babyStep],
                    inProgress: [...prev.inProgress],
                    done: [...prev.done],
                  };
                  const targetColumn = openSourceStatusToColumn[updatedEntry.status] || 'plan';
                  
                  let oldColumn: OpenSourceColumnId | null = null;
                  let oldIndex = -1;
                  Object.keys(newColumns).forEach(colId => {
                    const col = colId as OpenSourceColumnId;
                    const index = newColumns[col].findIndex(entry => entry.id === editingEntry.id);
                    if (index !== -1) {
                      oldColumn = col;
                      oldIndex = index;
                    }
                  });
                  
                  if (oldColumn !== null && oldIndex !== -1) {
                    const updatedCard: OpenSourceEntry = { ...updatedEntry };
                    if (oldColumn === targetColumn) {
                      newColumns[targetColumn] = [
                        ...newColumns[targetColumn].slice(0, oldIndex),
                        updatedCard,
                        ...newColumns[targetColumn].slice(oldIndex + 1)
                      ];
                    } else {
                      const sourceColumn = oldColumn as OpenSourceColumnId;
                      const sourceArray = newColumns[sourceColumn];
                      newColumns[sourceColumn] = [
                        ...sourceArray.slice(0, oldIndex),
                        ...sourceArray.slice(oldIndex + 1)
                      ];
                      newColumns[targetColumn] = [...newColumns[targetColumn], updatedCard];
                    }
                  } else {
                    const updatedCard: OpenSourceEntry = { ...updatedEntry };
                    newColumns[targetColumn] = [...newColumns[targetColumn], updatedCard];
                  }
                  
                  return newColumns;
                });
              } else {
                const response = await fetch(url, {
                  method: 'POST',
                  headers: getApiHeaders(),
                  body: JSON.stringify(data),
                });
                if (!response.ok) throw new Error('Failed to create open source criteria');
                const responseData = await response.json();
                updatedEntry = (responseData.entry || responseData) as OpenSourceEntry;
                
                setOpenSourceColumns(prev => {
                  const newColumns: Record<OpenSourceColumnId, OpenSourceEntry[]> = {
                    plan: [...prev.plan],
                    babyStep: [...prev.babyStep],
                    inProgress: [...prev.inProgress],
                    done: [...prev.done],
                  };
                  const targetColumn = openSourceStatusToColumn[updatedEntry.status] || 'plan';
                  const newCard: OpenSourceEntry = { ...updatedEntry };
                  newColumns[targetColumn] = [...newColumns[targetColumn], newCard];
                  return newColumns;
                });
              }
              setIsModalOpen(false);
              setEditingEntry(null);
            } catch (error) {
              console.error('Error saving open source criteria:', error);
              alert('Failed to save open source criteria. Please try again.');
              await fetchOpenSourceEntries();
            }
          }}
          selectedPartnership={selectedPartnership}
          activePartnershipCriteria={activePartnershipCriteria}
          availablePartnerships={availablePartnerships}
          fullPartnerships={fullPartnerships}
        />
      )}

    </section>
  );
}
