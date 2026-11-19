import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Star, Check, Video } from "lucide-react";

export const MeetingLeftPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [rating, setRating] = useState<number | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleRating = (stars: number) => {
    setRating(stars);
    setFeedbackSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-neutral-800">
        <Link to="/meet" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-500 transition">
            <Video className="w-5 h-5" />
          </div>
          <span className="text-xl font-medium tracking-tight text-white">
            Orvexa <span className="text-neutral-400 font-normal">Meet</span>
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto w-full">
        <h1 className="text-3xl font-medium tracking-tight text-white mb-3">
          You left the meeting
        </h1>
        <p className="text-sm text-neutral-400 mb-8">
          Meeting code: <span className="font-mono text-neutral-300">{code}</span>
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full mb-10">
          <button
            type="button"
            onClick={() => navigate(`/meet/${code}`)}
            className="w-full sm:flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-full shadow-md transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rejoin</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/meet")}
            className="w-full sm:flex-1 py-3 px-6 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-medium text-sm rounded-full transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to home screen</span>
          </button>
        </div>

        {/* Feedback Card */}
        <div className="w-full bg-neutral-800/60 border border-neutral-700/80 rounded-2xl p-6">
          <h2 className="text-sm font-medium text-neutral-200 mb-2">
            How was the audio and video quality?
          </h2>
          {feedbackSubmitted ? (
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm mt-3 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Thank you for your feedback!</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mt-4">
              {[1, 2, 3, 4, 5].map((stars) => (
                <button
                  key={stars}
                  type="button"
                  onClick={() => handleRating(stars)}
                  aria-label={`Rate ${stars} stars`}
                  className="p-1 text-neutral-500 hover:text-amber-400 transition hover:scale-125"
                >
                  <Star
                    className={`w-6 h-6 ${
                      rating && rating >= stars
                        ? "text-amber-400 fill-amber-400"
                        : ""
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MeetingLeftPage;
