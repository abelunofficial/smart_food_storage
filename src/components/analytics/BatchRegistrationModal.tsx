import React, { useState } from 'react';
import { X, Layers, Plus, Calendar, Check, AlertCircle } from 'lucide-react';
import type { FoodCategory } from '../../types/spoilage.ts';
import { FOOD_CATEGORY_LABELS } from '../../types/spoilage.ts';
import type { CreateBatchInput } from '../../services/spoilageService.ts';

interface BatchRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateBatchInput) => void;
}

const CATEGORIES: FoodCategory[] = [
  'fruits',
  'vegetables',
  'grains',
  'meat',
  'fish',
  'mixed',
  'other',
];

export const BatchRegistrationModal: React.FC<BatchRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<FoodCategory[]>(['fruits']);
  const [storageStartDate, setStorageStartDate] = useState<string>(() =>
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [warningThreshold, setWarningThreshold] = useState<number>(15.0);
  const [significantThreshold, setSignificantThreshold] = useState<number>(30.0);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleCategory = (cat: FoodCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((c) => c !== cat);
      }
      return [...prev, cat];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Please enter a descriptive batch name.');
      return;
    }

    if (selectedCategories.length === 0) {
      setFormError('Please select at least one food category.');
      return;
    }

    if (warningThreshold <= 0 || significantThreshold <= 0) {
      setFormError('Threshold percentages must be positive numbers.');
      return;
    }

    if (warningThreshold >= significantThreshold) {
      setFormError('Warning threshold must be strictly lower than significant change threshold.');
      return;
    }

    onSubmit({
      name: trimmedName,
      categories: selectedCategories,
      storageStartDate,
      notes,
      warningThreshold,
      significantChangeThreshold: significantThreshold,
    });

    onClose();
  };

  const isMixed = selectedCategories.length > 1 || selectedCategories.includes('mixed');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Register New Food Batch
              </h3>
              <p className="text-xs text-slate-500">
                Create an isolated batch profile for fresh-food baseline tracking
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Batch Name */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Batch Identifier / Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Batch #105 - Gala Apples (Crates 1-10)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
            />
          </div>

          {/* Food Categories (Multi-select) */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Food Categories (Multiple Allowed) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                        : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{FOOD_CATEGORY_LABELS[cat]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mixed Foods Technical Disclaimer */}
          {isMixed && (
            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-900 space-y-1">
              <span className="font-semibold block">Mixed Chamber Load Notice:</span>
              <p className="leading-relaxed text-[11px]">
                A mixed-food batch shares one collective chamber baseline. The uncalibrated MQ135 sensor measures composite volatile atmosphere changes and cannot discriminate between individual food items.
              </p>
            </div>
          )}

          {/* Storage Start Date */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Storage Intake Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                required
                value={storageStartDate}
                onChange={(e) => setStorageStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
              />
            </div>
          </div>

          {/* Initial Thresholds */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Warning Threshold (W %)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="100"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono"
                />
                <span className="absolute right-3 top-2 text-slate-400 font-mono">%</span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Significant Change (S %)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="2"
                  max="200"
                  value={significantThreshold}
                  onChange={(e) => setSignificantThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono"
                />
                <span className="absolute right-3 top-2 text-slate-400 font-mono">%</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Operator Notes / Chamber Shelf (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Chamber Tier 2, organic certification #4421"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
            />
          </div>

          {/* Local Persistence Disclosure */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
            Batch details, baselines, and history are saved in this browser only. They are not synchronized or backed up to the cloud.
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Batch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
