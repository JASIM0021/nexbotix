import { useState } from 'react';
import { Music, Play, ExternalLink, Heart, Sparkles, Volume2, CheckCircle2 } from 'lucide-react';
import { MusicRecommendation } from '../../types/life_companion';

interface Props {
  recommendations: MusicRecommendation[];
}

export function MusicRecommendationWidget({ recommendations }: Props) {
  const [activeTrack, setActiveTrack] = useState<MusicRecommendation | null>(
    recommendations && recommendations.length > 0 ? recommendations[0] : null
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="my-4 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-purple-950/80 p-4 sm:p-5 border border-indigo-500/30 shadow-2xl backdrop-blur-md">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-pulse">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-white flex items-center gap-1.5">
              <span>Peace & Mood Elevation Playlist</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h4>
            <p className="text-xs text-indigo-300/80">Curated audio & melodies to calm your mind and recharge motivation</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          <Heart className="w-3 h-3 text-pink-400 fill-pink-400" /> 3 Tracks Included
        </span>
      </div>

      {/* Embedded YouTube Player if active track selected */}
      {activeTrack && isPlaying && (
        <div className="relative mb-4 rounded-xl overflow-hidden border border-indigo-500/40 bg-black aspect-video shadow-lg">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${activeTrack.embed_id}?autoplay=1&rel=0`}
            title={activeTrack.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Tracks List */}
      <div className="space-y-2.5">
        {recommendations.map((track, idx) => {
          const isCurrent = activeTrack?.embed_id === track.embed_id;
          return (
            <div
              key={idx}
              onClick={() => {
                setActiveTrack(track);
                setIsPlaying(true);
              }}
              className={`group flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border ${
                isCurrent && isPlaying
                  ? 'bg-indigo-600/25 border-indigo-400/60 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-400/50'
                  : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-700/50 hover:border-indigo-500/40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTrack(track);
                    setIsPlaying(isCurrent ? !isPlaying : true);
                  }}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isCurrent && isPlaying
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50'
                      : 'bg-slate-800 text-indigo-400 border border-slate-700'
                  }`}
                >
                  {isCurrent && isPlaying ? (
                    <Volume2 className="w-4 h-4 animate-bounce" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-100 truncate group-hover:text-indigo-300">
                    {track.title}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate flex items-center gap-2">
                    <span>{track.artist}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span className="text-indigo-400/90 font-medium">{track.category}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                {isCurrent && isPlaying && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Playing
                  </span>
                )}
                <a
                  href={track.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Open in YouTube"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
