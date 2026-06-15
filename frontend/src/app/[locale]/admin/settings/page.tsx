'use client';

import { useParams, useRouter } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Crown,
  FileText,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/core/constants/queryKeys';
import { adminApi } from '@/core/services/adminApi';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const adminFont = Manrope({
  subsets: ['latin'],
  variable: '--admin-font',
  display: 'swap',
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

export default function SettingsPlansPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [editPlan, setEditPlan] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [loading, locale, router, user]);

  const { data: planData, isLoading } = useQuery({
    queryKey: [...adminKeys.all, 'plans'],
    queryFn: adminApi.paymentsPlans,
    enabled: !!user,
  });

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(null), 3500);
  };

  const handleSavePlan = async () => {
    if (!editPlan) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/plans/${editPlan.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPlan), credentials: 'include',
      });
      if (res.ok) { showFeedback('Plan saved'); setEditPlan(null); queryClient.invalidateQueries(); }
    } catch { showFeedback('Save failed'); }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/plans/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { showFeedback('Plan deleted'); setSelectedPlan(null); queryClient.invalidateQueries(); }
    } catch { showFeedback('Delete failed'); }
  };

  if (loading || !user) return null;

  return (
    <main className={`${adminFont.variable} ${styles.shell}`}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Settings</p>
          <h1 className={styles.title}>Plans Management</h1>
          <p className={styles.subtitle}>Configure parent and school subscription plans</p>
        </div>
      </div>

      <section className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2>Plans Overview</h2>
          <span>{(planData as any)?.parent_plans?.length + (planData as any)?.school_plans?.length || 0} total</span>
        </div>

        {isLoading ? (
          <div className={styles.loadingState}>
            <p>Loading plans...</p>
          </div>
        ) : (
          <div className={styles.plansContainer}>
            {/* Parent Plans */}
            <p className={styles.sectionLabel}>Parent Plans</p>
            <div className={styles.planGrid}>
              {((planData as any)?.parent_plans || []).map((p: any, i: number) => {
                const cardClass = p.code === 'free' ? styles.planCardFree
                  : p.code === 'focus' ? styles.planCardFocus
                  : p.code === 'premium' ? styles.planCardPremium
                  : p.code === 'ultimate' ? styles.planCardUltimate
                  : styles.planCardFree;
                const badgeClass = p.badge_label === 'Popular' ? styles.badgePopular
                  : p.badge_label === 'Best Value' ? styles.badgeBestValue
                  : '';
                return (
                  <div key={p.id}
                    className={`${styles.planCard} ${cardClass} ${styles.cardAnimate}`}
                    style={{ animationDelay: `${i * 0.08}s` }}
                    onClick={() => setSelectedPlan({ ...p, type: 'parent' })}>
                    <div className={styles.planCardTop}>
                      <span className={styles.planCardName}>{p.name}</span>
                      <span className={styles.planCardPrice}>₹{p.amount_monthly}<span className={styles.planCardPriceSub}>/mo</span></span>
                    </div>
                    {p.badge_label && (
                      <span className={`${styles.planBadgePill} ${badgeClass || styles.badgeDefault}`}>
                        {p.badge_label === 'Popular' ? <Star size={10} /> : p.badge_label === 'Best Value' ? <CheckCircle2 size={10} /> : null}
                        {p.badge_label}
                      </span>
                    )}
                    <div className={styles.planCardDesc}>{p.description || ''}</div>
                    <div className={styles.planFeatureChips}>
                      {(p.features || []).slice(0, 3).map((f: any) => (
                        <span key={f.code} className={`${styles.featureChip} ${f.limit === false ? styles.featureUnavail : f.limit === true || f.limit === 'unlimited' ? styles.featureAvail : styles.featureLimit}`}>
                          {f.limit === false ? '✕' : f.limit === true ? '✓' : String(f.limit === 'unlimited' ? '∞' : f.limit)} {f.name}
                        </span>
                      ))}
                      {(p.features || []).length > 3 && (
                        <span className={`${styles.featureChip} ${styles.featureLimit}`}>+{p.features.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* School Plans */}
            <p className={styles.sectionLabel} style={{ marginTop: '1.5rem' }}>School Plans</p>
            <div className={styles.planGrid}>
              {((planData as any)?.school_plans || []).map((p: any, i: number) => {
                const cardClass = p.type === 'free' ? styles.planCardBasic
                  : p.type === 'paid' ? styles.planCardStandard
                  : p.type === 'school' ? styles.planCardPremiumSchool
                  : styles.planCardFree;
                const badgeClass = p.badge_label === 'Most Popular' ? styles.badgePopular
                  : p.badge_label === 'Best Value' ? styles.badgeBestValue
                  : '';
                return (
                  <div key={p.type}
                    className={`${styles.planCard} ${cardClass} ${styles.cardAnimate}`}
                    style={{ animationDelay: `${((planData as any)?.parent_plans?.length || 0) + i * 0.08}s` }}
                    onClick={() => setSelectedPlan({ ...p, type: 'school' })}>
                    <div className={styles.planCardTop}>
                      <span className={styles.planCardName}>{p.name}</span>
                      <span className={styles.planCardPrice}>{p.display_price}<span className={styles.planCardPriceSub}>{p.period}</span></span>
                    </div>
                    {p.badge_label && (
                      <span className={`${styles.planBadgePill} ${badgeClass || styles.badgeDefault}`}>
                        {p.badge_label === 'Most Popular' ? <Star size={10} /> : p.badge_label === 'Best Value' ? <CheckCircle2 size={10} /> : null}
                        {p.badge_label}
                      </span>
                    )}
                    <div className={styles.planCardDesc}>{p.description || ''}</div>
                    <div className={styles.planCardMeta}>{p.active_schools} schools · ₹{(p.revenue_total ?? 0).toLocaleString()} revenue · ₹{(p.revenue_month ?? 0).toLocaleString()}/mo</div>
                    <div className={styles.planFeatureChips}>
                      {(p.features || []).map((f: any) => (
                        <span key={f.key} className={`${styles.featureChip} ${styles.featureAvail}`}>✓ {f.label}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Plan Detail Modal */}
      {selectedPlan && (
        <div className={styles.modalOverlay} onClick={() => { setSelectedPlan(null); setEditPlan(null); }}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            {editPlan ? (
              <>
                <div className={styles.modalHeader}>
                  <h2><FileText size={18} /> Edit Plan</h2>
                  <button className={styles.closeButton} onClick={() => setEditPlan(null)}>
                    <X size={20} />
                  </button>
                </div>
                <div className={styles.modalCardBody}>
                  <div className={styles.editForm}>
                    <div className={styles.editField}>
                      <label>Plan Name</label>
                      <input className={styles.editInput} value={editPlan.name} onChange={e => setEditPlan({ ...editPlan, name: e.target.value })} />
                    </div>
                    <div className={styles.editField}>
                      <label>Description</label>
                      <textarea className={styles.editInput} rows={2} value={editPlan.description || ''} onChange={e => setEditPlan({ ...editPlan, description: e.target.value })} />
                    </div>
                    <div className={styles.editField}>
                      <label>Monthly Price (₹)</label>
                      <input className={styles.editInput} type="number" value={editPlan.amount_monthly} onChange={e => setEditPlan({ ...editPlan, amount_monthly: Number(e.target.value) })} />
                    </div>
                    <div className={styles.editField}>
                      <label>Yearly Price (₹)</label>
                      <input className={styles.editInput} type="number" value={editPlan.amount_yearly || ''} onChange={e => setEditPlan({ ...editPlan, amount_yearly: Number(e.target.value) || null })} />
                    </div>
                    <div className={styles.editField}>
                      <label>Trial Days</label>
                      <input className={styles.editInput} type="number" value={editPlan.trial_days} onChange={e => setEditPlan({ ...editPlan, trial_days: Number(e.target.value) })} />
                    </div>
                    <div className={styles.editField}>
                      <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked={editPlan.is_active !== false} onChange={e => setEditPlan({ ...editPlan, is_active: e.target.checked })} />
                        Active
                      </label>
                    </div>
                  </div>
                </div>
                <div className={styles.editActions}>
                  <button onClick={() => setEditPlan(null)}>Cancel</button>
                  <button onClick={handleSavePlan}>Save Changes</button>
                </div>
              </>
            ) : (
              <>
                <button className={styles.modalCloseFloat} onClick={() => { setSelectedPlan(null); setEditPlan(null); }}>
                  <X size={16} />
                </button>
                <div className={styles.modalCardBody}>
                  {/* Header */}
                  {(() => {
                    const planColor = selectedPlan.code === 'focus' || selectedPlan.type === 'paid' ? '#3b82f6'
                      : selectedPlan.code === 'premium' ? '#8b5cf6'
                      : selectedPlan.code === 'ultimate' ? '#f59e0b'
                      : selectedPlan.type === 'school' ? '#22c55e'
                      : '#94a3b8';
                    const planBg = selectedPlan.code === 'focus' || selectedPlan.type === 'paid' ? '#eff6ff'
                      : selectedPlan.code === 'premium' ? '#f5f3ff'
                      : selectedPlan.code === 'ultimate' ? '#fffbeb'
                      : selectedPlan.type === 'school' ? '#f0fdf4'
                      : '#f8fafc';
                    return (
                      <div className={styles.planDetailHeader} style={{ background: planBg, color: planColor }}>
                        <div className={styles.planDetailTop}>
                          <div className={styles.planDetailIcon} style={{ background: planColor + '18', color: planColor }}>
                            {selectedPlan.code === 'free' ? '🆓' : selectedPlan.code === 'focus' ? '🎯' : selectedPlan.code === 'premium' ? '💎' : selectedPlan.code === 'ultimate' ? '👑' : '🏫'}
                          </div>
                          <div className={styles.planDetailInfo}>
                            <h2 className={styles.planDetailName}>{selectedPlan.name}</h2>
                            {selectedPlan.badge_label && (
                              <span className={styles.planDetailBadge}
                                style={{
                                  background: selectedPlan.badge_label === 'Popular' ? '#dbeafe' : selectedPlan.badge_label === 'Best Value' ? '#ede9fe' : '#f1f5f9',
                                  color: selectedPlan.badge_label === 'Popular' ? '#1d4ed8' : selectedPlan.badge_label === 'Best Value' ? '#6d28d9' : '#475569'
                                }}>
                                {selectedPlan.badge_label === 'Popular' ? '★' : selectedPlan.badge_label === 'Best Value' ? '✓' : ''} {selectedPlan.badge_label}
                              </span>
                            )}
                          </div>
                          <div className={styles.planDetailPrice}>
                            <span className={styles.planDetailPriceAmount} style={{ color: planColor }}>
                              {selectedPlan.type === 'parent' ? `₹${selectedPlan.amount_monthly}` : selectedPlan.display_price}
                            </span>
                            <span className={styles.planDetailPricePeriod}>
                              {selectedPlan.type === 'parent' ? '/month' : selectedPlan.period}
                            </span>
                          </div>
                        </div>
                        <p className={styles.planDetailDesc}>{selectedPlan.description || 'No description available'}</p>
                        {selectedPlan.type === 'parent' && selectedPlan.trial_days > 0 && (
                          <div className={styles.planDetailTrial}>
                            <Clock size={11} /> {selectedPlan.trial_days}-day free trial
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Stats Row */}
                  <div className={styles.planDetailStats}>
                    <div className={styles.planDetailStat}>
                      <p className={styles.planDetailStatLabel}>Features</p>
                      <p className={styles.planDetailStatValue}>{(selectedPlan.features || []).length}</p>
                    </div>
                    {selectedPlan.type === 'parent' ? (
                      <>
                        <div className={styles.planDetailStat}>
                          <p className={styles.planDetailStatLabel}>Trial</p>
                          <p className={styles.planDetailStatValue}>{selectedPlan.trial_days || 0}d</p>
                        </div>
                        <div className={styles.planDetailStat}>
                          <p className={styles.planDetailStatLabel}>Yearly</p>
                          <p className={styles.planDetailStatValue}>₹{selectedPlan.amount_yearly || '-'}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.planDetailStat}>
                          <p className={styles.planDetailStatLabel}>Schools</p>
                          <p className={styles.planDetailStatValue}>{selectedPlan.active_schools || 0}</p>
                        </div>
                        <div className={styles.planDetailStat}>
                          <p className={styles.planDetailStatLabel}>Revenue</p>
                          <p className={styles.planDetailStatValue}>₹{(selectedPlan.revenue_total || 0).toLocaleString()}</p>
                        </div>
                        <div className={styles.planDetailStat}>
                          <p className={styles.planDetailStatLabel}>Max Students</p>
                          <p className={styles.planDetailStatValue}>{selectedPlan.max_students != null ? selectedPlan.max_students : '∞'}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Features */}
                  <div className={styles.planDetailFeatures}>
                    <p className={styles.planDetailFeaturesTitle}>
                      <Award size={12} /> Plan Features
                    </p>
                    <div className={styles.planDetailFeatureList}>
                      {(selectedPlan.features || []).map((f: any) => {
                        const isSchool = selectedPlan.type === 'school';
                        const isAvail = isSchool ? true : (f.limit === true || f.limit === 'unlimited');
                        const isCross = isSchool ? false : (f.limit === false);
                        return (
                          <div key={f.code || f.key} className={styles.planDetailFeatureRow}>
                            <div className={styles.planDetailFeatureLeft}>
                              <div className={styles.planDetailFeatureIcon}
                                style={{
                                  background: isAvail ? '#ecfdf5' : isCross ? '#fef2f2' : '#f1f5f9',
                                  color: isAvail ? '#059669' : isCross ? '#dc2626' : '#6b7280'
                                }}>
                                {isAvail ? '✓' : isCross ? '✕' : '~'}
                              </div>
                              <span className={styles.planDetailFeatureName}>{f.name || f.label}</span>
                            </div>
                            <span className={`${styles.planDetailFeatureValue} ${isAvail ? styles.planDetailFvAvail : isCross ? styles.planDetailFvCross : styles.planDetailFvLimit}`}>
                              {isAvail ? 'Included' : isCross ? 'Not available' : String(f.limit)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedPlan.type === 'parent' && (
                  <div className={styles.planDetailActions}>
                    <button className={`${styles.planDetailActionBtn} ${styles.planDetailActionEdit}`}
                      onClick={() => setEditPlan({ ...selectedPlan })}>
                      <FileText size={14} /> Edit Plan
                    </button>
                    <button className={`${styles.planDetailActionBtn} ${styles.planDetailActionDanger}`}
                      onClick={() => handleDeletePlan(selectedPlan.id)}>
                      <Trash2 size={14} /> Deactivate
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {feedback && <div className={styles.toast}>{feedback}</div>}
    </main>
  );
}
