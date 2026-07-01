import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Target,
  Briefcase,
  Camera,
  MessageCircle,
  ThumbsUp,
  PlaySquare,
  Upload,
  CheckCircle,
  Link as LinkIcon,
  Clock,
  Plus,
  X,
} from 'lucide-react';
import api from '../lib/axios';
import useAuthStore from '../store/auth';
import CreateTaskForm from '../components/CreateTaskForm';
import {
  PageHeader,
  Card,
  Btn,
  Badge,
  EmptyState,
  Spinner,
} from '../components/ui';

const PLATFORM_ICON = {
  LinkedIn: <Briefcase className="w-5 h-5" />,
  Instagram: <Camera className="w-5 h-5" />,
  Twitter: <MessageCircle className="w-5 h-5" />,
  Facebook: <ThumbsUp className="w-5 h-5" />,
  YouTube: <PlaySquare className="w-5 h-5" />,
};

const overdue = (d) => new Date(d) < new Date();

// 💡 Extracted TaskCard to isolate state per task item
function TaskCard({ task, user, canVerify, verifyMutation, submitMutation }) {
  const [didComment, setDidComment] = useState(false);
  const [didRepost, setDidRepost] = useState(false);
  const [didShare, setDidShare] = useState(false);
  const [showProofs, setShowProofs] = useState(false);

  // Fetch proofs only if this specific task has proofs expanded
  const { data: proofs, isLoading: isLoadingProofs } = useQuery({
    queryKey: ['proofs', task.id],
    queryFn: () => api.get(`/proofs/task/${task.id}`).then((res) => res.data),
    enabled: showProofs,
  });

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!didComment && !didRepost && !didShare) {
      alert('Please select at least one engagement action.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB.');
      return;
    }

    submitMutation.mutate(
      {
        taskId: task.id,
        file,
        didComment,
        didRepost,
        didShare,
      },
      {
        onSuccess: () => {
          // Reset local checkbox states on successful submission
          setDidComment(false);
          setDidRepost(false);
          setDidShare(false);
        },
      }
    );
  };

  const isSubmitting =
    submitMutation.isPending && submitMutation.variables?.taskId === task.id;

  return (
    <Card className="p-5 card-hover">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center text-xl shrink-0">
          {PLATFORM_ICON[task.target_platform] || (
            <Target className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-800">{task.title}</h3>
            {task.target_platform && (
              <Badge color="purple">{task.target_platform}</Badge>
            )}
            {task.deadline && (
              <Badge color={overdue(task.deadline) ? 'red' : 'green'}>
                {overdue(task.deadline) ? 'Overdue' : 'Active'}
              </Badge>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            {task.task_link && (
              <a
                href={task.task_link}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline flex items-center gap-1"
              >
                <LinkIcon className="w-3.5 h-3.5" /> Task link
              </a>
            )}
            {task.deadline && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(task.deadline).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'Asia/Kolkata',
                })}{' '}
                IST
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        {canVerify && (
          <Btn variant="outline" onClick={() => setShowProofs((prev) => !prev)}>
            {showProofs ? 'Hide proofs' : 'View proofs'}
          </Btn>
        )}

        {user?.role === 'INTERN' && (
          <div className="space-y-3">
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={didComment}
                  disabled={isSubmitting}
                  onChange={(e) => setDidComment(e.target.checked)}
                />
                Comment
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={didRepost}
                  disabled={isSubmitting}
                  onChange={(e) => setDidRepost(e.target.checked)}
                />
                Repost
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={didShare}
                  disabled={isSubmitting}
                  onChange={(e) => setDidShare(e.target.checked)}
                />
                Share
              </label>
            </div>

            <label
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-green-600 text-white cursor-pointer hover:shadow-lg transition w-max ${
                isSubmitting ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <Upload className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Proof'}
              <input
                type="file"
                accept="image/*"
                disabled={isSubmitting}
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {showProofs && (
        <div className="mt-4 border-t pt-4 space-y-2 animate-fade-in">
          <h4 className="text-sm font-semibold text-gray-700">
            Proof submissions
          </h4>
          {isLoadingProofs ? (
            <div className="py-2 text-xs text-gray-400">Loading proofs...</div>
          ) : !proofs?.length ? (
            <p className="text-xs text-gray-400">No submissions yet.</p>
          ) : (
            proofs.map((p) => {
              const normalized = p.image_path
                ?.replace(/\\/g, '/')
                .replace(/^\/+/, '');
              const base = (import.meta.env.VITE_API_BASE_URL || '').replace(
                /\/+$/,
                ''
              );
              const src = base ? `${base}/${normalized}` : `/${normalized}`;
              const isVerifying =
                verifyMutation.isPending &&
                verifyMutation.variables?.proofId === p.id;

              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 bg-gray-50 rounded-xl p-2"
                >
                  {p.image_path && (
                    <img
                      src={src}
                      alt="proof"
                      className="w-14 h-14 rounded-lg object-cover border"
                      onError={(e) => {
                        e.currentTarget.style.visibility = 'hidden';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0 text-xs">
                    <Badge color={p.status === 'VERIFIED' ? 'green' : 'yellow'}>
                      {p.status}
                    </Badge>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {p.did_comment && <Badge color="blue">Comment</Badge>}
                      {p.did_repost && <Badge color="purple">Repost</Badge>}
                      {p.did_share && <Badge color="green">Share</Badge>}
                    </div>
                    <p className="text-gray-400 mt-1 truncate">
                      Intern:{' '}
                      {p.intern_name ||
                        p.intern_email ||
                        `${p.intern_id.slice(0, 8)}…`}
                    </p>
                  </div>
                  {canVerify && p.status === 'PENDING' && (
                    <Btn
                      variant="success"
                      disabled={isVerifying}
                      onClick={() =>
                        verifyMutation.mutate({
                          proofId: p.id,
                          taskId: task.id,
                        })
                      }
                    >
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />{' '}
                        {isVerifying ? 'Verifying...' : 'Verify'}
                      </span>
                    </Btn>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </Card>
  );
}

export default function Tasks() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const canCreateTask = ['ADMIN', 'SENIOR_TL'].includes(user?.role);
  const canVerify = ['ADMIN', 'CAPTAIN', 'TL', 'SENIOR_TL'].includes(
    user?.role
  );

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks').then((res) => res.data),
  });

  const submitMutation = useMutation({
    mutationFn: ({ taskId, file, didComment, didRepost, didShare }) => {
      const form = new FormData();
      form.append('task_id', taskId);
      form.append('image', file);
      form.append('didComment', didComment);
      form.append('didRepost', didRepost);
      form.append('didShare', didShare);

      return api.post('/proofs/submit', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proofs', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ proofId }) => api.patch(`/proofs/${proofId}/verify`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proofs', variables.taskId] });
    },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg shadow-sm">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              Social Media Tasks
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Campaigns & proof verification
            </p>
          </div>
        </div>

        {canCreateTask && (
          <Btn onClick={() => setShowForm((s) => !s)}>
            {showForm ? (
              <span className="flex items-center gap-1">
                <X className="w-4 h-4" /> Cancel
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Plus className="w-4 h-4" /> Create task
              </span>
            )}
          </Btn>
        )}
      </div>

      {showForm && canCreateTask && (
        <div className="mb-5 animate-fade-in-up">
          <CreateTaskForm />
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : !tasks?.length ? (
        <EmptyState
          icon={<Target className="w-12 h-12 text-gray-400" />}
          title="No tasks yet"
          text={
            canCreateTask
              ? 'Create a campaign to get started.'
              : 'New tasks will appear here.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              user={user}
              canVerify={canVerify}
              verifyMutation={verifyMutation}
              submitMutation={submitMutation}
            />
          ))}
        </div>
      )}
    </div>
  );
}
