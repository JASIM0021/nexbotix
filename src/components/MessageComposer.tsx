import React, { useState, useRef, useMemo } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Message } from '@/types/message';
import { MessageSquare, Link, Image as ImageIcon, Upload, X, FileText, Plus, Trash2, Clock, Flag } from 'lucide-react';
import { apiFetch, API_BASE_URL } from '@/config/api';
import { Template } from '@/types/template';
import { TemplateSelector } from './templates/TemplateSelector';
import { TemplateEditor } from './templates/TemplateEditor';
import { useTemplates } from '@/hooks/useTemplates';

interface MessageSet {
  text: string;
  link: string;
  imageUrl: string;
  uploadedImage: { file: File; preview: string; path: string } | null;
  isUploading: boolean;
  uploadError: string;
}

const createEmptySet = (): MessageSet => ({
  text: '',
  link: '',
  imageUrl: '',
  uploadedImage: null,
  isUploading: false,
  uploadError: '',
});

interface MessageComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (messages: Message[], scheduledAt?: Date, campaignName?: string) => void;
  selectedCount: number;
  inline?: boolean;
  isWhatsAppConnected?: boolean;
}

export function MessageComposer({
  isOpen,
  onClose,
  onSend,
  selectedCount,
  inline,
  isWhatsAppConnected,
}: MessageComposerProps) {
  const { templates, isLoading: templatesLoading, createTemplate } = useTemplates();
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const [messageSets, setMessageSets] = useState<MessageSet[]>([createEmptySet()]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Schedule state
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');  // datetime-local string

  // Campaign state
  const [createCampaign, setCreateCampaign] = useState(false);
  const [campaignName, setCampaignName] = useState('');

  // Preview text for set[0] with template variable resolution
  const previewText = useMemo(() => {
    if (!selectedTemplate) return messageSets[0]?.text || '';
    let text = selectedTemplate.body;
    Object.entries(variableValues).forEach(([key, value]) => {
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
    });
    return text.replace(/{{name}}/g, 'John');
  }, [selectedTemplate, messageSets, variableValues]);

  const handleTemplateSelect = (template: Template | null) => {
    setSelectedTemplate(template);
    setVariableValues({});
    setMessageSets(prev => {
      const updated = [...prev];
      updated[0] = { ...updated[0], text: template ? template.body : '' };
      return updated;
    });
  };

  const handleVariableChange = (name: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [name]: value }));
  };

  const handleTextChange = (index: number, text: string) => {
    setMessageSets(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], text };
      return updated;
    });
    if (index === 0 && selectedTemplate) {
      setSelectedTemplate({ ...selectedTemplate, body: text });
    }
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessageSets(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], uploadError: 'Please select an image file' };
        return updated;
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessageSets(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], uploadError: 'Image must be less than 10MB' };
        return updated;
      });
      return;
    }

    setMessageSets(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], uploadError: '', isUploading: true };
      return updated;
    });

    try {
      const preview = URL.createObjectURL(file);
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiFetch(`${API_BASE_URL}/api/upload/image`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setMessageSets(prev => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            isUploading: false,
            uploadedImage: { file, preview, path: data.filePath },
            imageUrl: '',
          };
          return updated;
        });
      } else {
        setMessageSets(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], isUploading: false, uploadError: data.error || 'Upload failed' };
          return updated;
        });
      }
    } catch (error: unknown) {
      setMessageSets(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          isUploading: false,
          uploadError: error instanceof Error ? error.message : 'Failed to upload image',
        };
        return updated;
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    const set = messageSets[index];
    if (set.uploadedImage?.preview) URL.revokeObjectURL(set.uploadedImage.preview);
    setMessageSets(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], uploadedImage: null };
      return updated;
    });
    if (fileInputRefs.current[index]) fileInputRefs.current[index]!.value = '';
  };

  const addMessageSet = () => {
    setMessageSets(prev => [...prev, createEmptySet()]);
  };

  const removeMessageSet = (index: number) => {
    const set = messageSets[index];
    if (set.uploadedImage?.preview) URL.revokeObjectURL(set.uploadedImage.preview);
    setMessageSets(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    const validSets = messageSets.filter(s => s.text.trim());
    if (validSets.length === 0) return;

    const messages: Message[] = validSets.map((set, i) => {
      let finalText = set.text;
      // Apply template variable resolution only for set[0]
      if (i === 0 && selectedTemplate) {
        finalText = selectedTemplate.body;
        Object.entries(variableValues).forEach(([key, value]) => {
          if (key !== 'name') {
            finalText = finalText.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
          }
        });
      }
      return {
        text: finalText,
        link: set.link,
        imageUrl: set.imageUrl,
        imagePath: set.uploadedImage?.path,
      };
    });

    const scheduleDate = scheduleEnabled && scheduledAt ? new Date(scheduledAt) : undefined;
    const campaign = createCampaign && campaignName.trim() ? campaignName.trim() : undefined;
    onSend(messages, scheduleDate, campaign);

    // Reset state
    messageSets.forEach(s => {
      if (s.uploadedImage?.preview) URL.revokeObjectURL(s.uploadedImage.preview);
    });
    setMessageSets([createEmptySet()]);
    setSelectedTemplate(null);
    setVariableValues({});
    setScheduleEnabled(false);
    setScheduledAt('');
    setCreateCampaign(false);
    setCampaignName('');
    if (!inline) onClose();
  };

  const validSetCount = messageSets.filter(s => s.text.trim()).length;

  // Min datetime for the picker: 1 minute from now
  const minDateTime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  const composerBody = (
    <div className="space-y-6">
      {/* Selected contacts info — only shown in modal mode */}
      {!inline && (
        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <p className="text-sm font-medium text-primary-900">
            Sending to {selectedCount} selected {selectedCount === 1 ? 'contact' : 'contacts'}
          </p>
        </div>
      )}

      {/* Template toggle (applies to Message 1) */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
            showTemplates
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-700'
          }`}
        >
          <FileText size={18} />
          <span className="font-medium">{showTemplates ? 'Hide Templates' : 'Use Template'}</span>
        </button>
        {selectedTemplate && (
          <span className="text-sm text-green-600 font-medium">
            Using: {selectedTemplate.name}
          </span>
        )}
      </div>

      {/* Template Selector */}
      {showTemplates && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          {templatesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Loading templates...</p>
            </div>
          ) : (
            <TemplateSelector
              templates={templates}
              selected={selectedTemplate}
              onSelect={handleTemplateSelect}
              resolvedText={previewText}
              variableValues={variableValues}
              onVariableChange={handleVariableChange}
              onCreateTemplate={() => setShowTemplateEditor(true)}
            />
          )}
        </div>
      )}

      {/* Message Sets */}
      {messageSets.map((set, index) => (
        <div
          key={index}
          className="border-2 border-gray-200 rounded-xl p-4 space-y-4"
        >
          {/* Set header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              {messageSets.length > 1 ? `Message ${index + 1}` : 'Message'}
              {index === 0 && selectedTemplate ? ` — ${selectedTemplate.name}` : ''}
            </span>
            {messageSets.length > 1 && (
              <button
                onClick={() => removeMessageSet(index)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                type="button"
                title="Remove this message"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Message text */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MessageSquare size={18} />
              Message Text *
            </label>
            <textarea
              value={set.text}
              onChange={(e) => handleTextChange(index, e.target.value)}
              placeholder="Enter your message here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={1000}
            />
            <div className="flex flex-col sm:flex-row justify-between gap-1 mt-1">
              {index === 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <span className="font-medium text-blue-600">Anti-Ban Spintax:</span> Use <code className="bg-blue-50 text-blue-700 px-1 py-0.5 rounded font-mono text-[11px]">{'{Hi|Hello|Hey}'}</code> for random variation.
                  </p>
                  <p className="text-xs text-emerald-700 font-medium">
                    Tip: Include "Reply STOP to opt out" so unhappy recipients don't report your account.
                  </p>
                </div>
              )}
              <p className={`text-xs ml-auto ${set.text.length > 900 ? 'text-red-600' : 'text-gray-500'}`}>
                {set.text.length} / 1000
              </p>
            </div>
          </div>

          {/* Link */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Link size={18} />
              Link (Optional)
            </label>
            <input
              type="url"
              value={set.link}
              onChange={(e) => setMessageSets(prev => {
                const updated = [...prev];
                updated[index] = { ...updated[index], link: e.target.value };
                return updated;
              })}
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Link will be added at the end of your message</p>
          </div>

          {/* Image */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <ImageIcon size={18} />
              Image (Optional)
            </label>

            {!set.uploadedImage ? (
              <div className="space-y-3">
                <div>
                  <input
                    ref={(el) => { fileInputRefs.current[index] = el; }}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(index, e)}
                    className="hidden"
                    id={`image-upload-${index}`}
                  />
                  <label
                    htmlFor={`image-upload-${index}`}
                    className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 cursor-pointer transition-colors ${set.isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Upload size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {set.isUploading ? 'Uploading...' : 'Click to upload image'}
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Supports: JPG, PNG, GIF, WebP (max 10MB)</p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>

                <div>
                  <input
                    type="url"
                    value={set.imageUrl}
                    onChange={(e) => setMessageSets(prev => {
                      const updated = [...prev];
                      updated[index] = { ...updated[index], imageUrl: e.target.value };
                      return updated;
                    })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={set.isUploading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Or paste an image URL</p>
                </div>
              </div>
            ) : (
              <div className="relative border border-gray-300 rounded-lg p-3 bg-gray-50">
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  type="button"
                >
                  <X size={16} />
                </button>
                <div className="flex items-center gap-3">
                  <img src={set.uploadedImage.preview} alt="Preview" className="w-20 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{set.uploadedImage.file.name}</p>
                    <p className="text-xs text-gray-500">{(set.uploadedImage.file.size / 1024).toFixed(1)} KB</p>
                    <p className="text-xs text-green-600 mt-1">✓ Uploaded successfully</p>
                  </div>
                </div>
              </div>
            )}
            {set.uploadError && <p className="text-xs text-red-600 mt-1">{set.uploadError}</p>}
          </div>

          {/* Per-set preview */}
          {set.text && (
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <p className="text-xs font-medium text-gray-600 mb-2">
                {index === 0 && selectedTemplate ? 'Preview ({{name}} shown as "John"):' : 'Preview:'}
              </p>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {index === 0 ? previewText : set.text}
                </p>
                {set.link && (
                  <a
                    href={set.link}
                    className="text-sm text-blue-600 hover:underline mt-2 block"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {set.link}
                  </a>
                )}
                {(set.imageUrl || set.uploadedImage) && (
                  <div className="mt-3">
                    {set.uploadedImage ? (
                      <img
                        src={set.uploadedImage.preview}
                        alt="Attachment preview"
                        className="max-w-[200px] max-h-[150px] object-cover rounded-lg border border-gray-200"
                      />
                    ) : set.imageUrl ? (
                      <img
                        src={set.imageUrl}
                        alt="Attachment preview"
                        className="max-w-[200px] max-h-[150px] object-cover rounded-lg border border-gray-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : null}
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <ImageIcon size={12} />
                      Image attachment
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add Another Message button */}
      <button
        onClick={addMessageSet}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-primary-300 rounded-xl text-primary-600 hover:border-primary-500 hover:bg-primary-50 transition-colors font-medium"
        type="button"
      >
        <Plus size={20} />
        Add Another Message
      </button>

      {/* Schedule toggle */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setScheduleEnabled(v => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${scheduleEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${scheduleEnabled ? 'translate-x-5' : ''}`} />
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className={scheduleEnabled ? 'text-blue-600' : 'text-gray-400'} />
            <span className={`text-sm font-medium ${scheduleEnabled ? 'text-blue-700' : 'text-gray-600'}`}>
              Schedule for later
            </span>
          </div>
        </label>

        {scheduleEnabled && (
          <div className="pl-1">
            <label className="block text-xs text-gray-500 mb-1">Send at</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              min={minDateTime}
              onChange={e => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">Messages will be queued and sent automatically at the selected time.</p>
          </div>
        )}
      </div>

      {/* Campaign toggle */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={createCampaign}
            onChange={e => setCreateCampaign(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
          />
          <div className="flex items-center gap-2">
            <Flag size={16} className={createCampaign ? 'text-green-600' : 'text-gray-400'} />
            <span className={`text-sm font-medium ${createCampaign ? 'text-green-700' : 'text-gray-600'}`}>
              Save as campaign
            </span>
          </div>
        </label>

        {createCampaign && (
          <div className="pl-1">
            <label className="block text-xs text-gray-500 mb-1">Campaign name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              placeholder="e.g. Summer Sale 2025"
              maxLength={80}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">Track replies and delivery stats under Campaigns.</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {!inline && (
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        )}
        <div className="relative" title={inline && !isWhatsAppConnected ? 'Connect WhatsApp first' : undefined}>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={validSetCount === 0 || (scheduleEnabled && !scheduledAt) || (inline && !isWhatsAppConnected) || (createCampaign && !campaignName.trim())}
            className={scheduleEnabled ? '!bg-blue-600 hover:!bg-blue-700' : ''}
          >
            {scheduleEnabled ? (
              <><Clock size={16} className="mr-1.5 inline" />Schedule{validSetCount > 1 ? ` ${validSetCount} Messages` : ''}</>
            ) : (
              validSetCount > 1 ? `Send ${validSetCount} Messages` : 'Send Messages'
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {inline ? (
        <div className="space-y-5 p-5">
          {composerBody}
        </div>
      ) : (
        <Modal isOpen={isOpen} onClose={onClose} title="Compose Message" maxWidth="xl">
          {composerBody}
        </Modal>
      )}

      {/* Template Editor */}
      <TemplateEditor
        isOpen={showTemplateEditor}
        onClose={() => setShowTemplateEditor(false)}
        onSave={async (payload) => {
          const created = await createTemplate(payload);
          handleTemplateSelect(created);
          setShowTemplates(true);
        }}
      />
    </>
  );
}
