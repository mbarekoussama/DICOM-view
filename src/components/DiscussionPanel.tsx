'use client';

import { useState, useRef, useEffect } from 'react';

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  role: 'doctor' | 'radiologist' | 'admin';
}

interface DiscussionPanelProps {
  imageId: string;
}

export default function DiscussionPanel({ imageId }: DiscussionPanelProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'Dr. Dupont',
      content: 'Image bien visualisée',
      timestamp: new Date(Date.now() - 3600000),
      role: 'radiologist',
    },
  ]);
  const [newComment, setNewComment] = useState('');
  const [userRole, setUserRole] = useState<'doctor' | 'radiologist' | 'admin'>('doctor');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: String(comments.length + 1),
      author: userRole === 'doctor' ? 'Dr. Vous' : 'Vous',
      content: newComment,
      timestamp: new Date(),
      role: userRole,
    };

    setComments([...comments, comment]);
    setNewComment('');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'bg-blue-600';
      case 'radiologist':
        return 'bg-purple-600';
      case 'admin':
        return 'bg-red-600';
      default:
        return 'bg-slate-600';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-800">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-white">
                  {comment.author}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded text-white ${getRoleBadgeColor(
                    comment.role
                  )}`}
                >
                  {comment.role === 'doctor'
                    ? 'Médecin'
                    : comment.role === 'radiologist'
                    ? 'Radiologue'
                    : 'Admin'}
                </span>
                <span className="text-xs text-slate-500">
                  {formatTime(comment.timestamp)}
                </span>
              </div>
              <p className="text-xs text-slate-300 bg-slate-700 rounded px-3 py-2">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-700 p-3 bg-slate-900">
        <div className="mb-2">
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as any)}
            className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 text-xs mb-2"
          >
            <option value="doctor">Médecin</option>
            <option value="radiologist">Radiologue</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            placeholder="Ajouter un commentaire..."
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
          <button
            onClick={handleAddComment}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs transition font-medium"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
