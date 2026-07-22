import { useState } from 'react';
import { Youtube, CheckCircle2, Clock, UploadCloud, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { LearningTask } from '../../types/life_companion';

interface Props {
  task: LearningTask;
  onCompleteVideo?: () => void;
  onUploadScreenshot?: (file: File) => void;
  isSubmitting?: boolean;
}

export function AssignmentVerificationCard({ task, onCompleteVideo, onUploadScreenshot, isSubmitting }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleFileChange = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="my-4 rounded-2xl bg-slate-900/90 border border-slate-700/60 p-4 sm:p-6 shadow-2xl backdrop-blur-lg">
      {/* Task Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {task.category || 'Learning Assignment'}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">{task.title}</h3>
          </div>
        </div>
        {task.estimated_minutes && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{task.estimated_minutes} min</span>
          </div>
        )}
      </div>

      <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">{task.description}</p>

      {/* Embedded YouTube Video if present */}
      {task.embed_id && (
        <div className="mb-5 rounded-xl overflow-hidden border border-purple-500/30 bg-black aspect-video shadow-xl">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${task.embed_id}?rel=0`}
            title={task.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Verification Type 1: Video Completion Button */}
      {task.verification_type === 'text_question' && onCompleteVideo && (
        <div className="bg-purple-950/40 rounded-xl p-4 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-purple-200">
            <Youtube className="w-5 h-5 text-red-500 shrink-0" />
            <span>Completed watching this video? Click below to tell your AI mentor!</span>
          </div>
          <button
            onClick={onCompleteVideo}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Completed the Video!</span>
          </button>
        </div>
      )}

      {/* Verification Type 2: Screenshot Upload Dropzone */}
      {task.verification_type === 'screenshot' && onUploadScreenshot && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-purple-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Attach Screenshot for AI Task Verification</span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-purple-400 bg-purple-500/10 scale-[1.01]'
                : previewUrl
                ? 'border-emerald-500/50 bg-emerald-950/20'
                : 'border-slate-700 bg-slate-950/50 hover:border-purple-500/50 hover:bg-slate-900/80'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="screenshot-upload-input"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {previewUrl ? (
              <div className="space-y-3">
                <img
                  src={previewUrl}
                  alt="Task Screenshot Preview"
                  className="max-h-48 mx-auto rounded-lg border border-slate-700 shadow-md object-contain"
                />
                <p className="text-xs text-emerald-400 font-medium">{selectedFile?.name}</p>
                <label
                  htmlFor="screenshot-upload-input"
                  className="text-xs text-purple-400 hover:underline cursor-pointer inline-block"
                >
                  Change Image
                </label>
              </div>
            ) : (
              <label htmlFor="screenshot-upload-input" className="cursor-pointer block space-y-2">
                <UploadCloud className="w-8 h-8 text-purple-400 mx-auto animate-bounce" />
                <p className="text-xs sm:text-sm font-medium text-slate-200">
                  Drag & Drop your task screenshot here, or <span className="text-purple-400 underline">Browse File</span>
                </p>
                <p className="text-[11px] text-slate-400">Supports PNG, JPG, WEBP (Max 10 MB)</p>
              </label>
            )}
          </div>

          {selectedFile && (
            <button
              disabled={isSubmitting}
              onClick={() => onUploadScreenshot(selectedFile)}
              className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating Screenshot with AI Vision...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Submit Screenshot for AI Evaluation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
