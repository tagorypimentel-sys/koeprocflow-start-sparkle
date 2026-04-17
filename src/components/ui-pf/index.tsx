import React from 'react';
import { RCStatus, UserRole } from '../../types';
import { STATUS_CONFIG, ROLE_LABELS, ROLE_COLORS, AVATAR_COLORS } from '../../lib/constants';

// ─── Badge ───────────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: RCStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
export function RoleBadge({ role }: { role: UserRole }) {
  const color = ROLE_COLORS[role];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
      style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ initials, size = 32, colorIndex = 0 }: { initials: string; size?: number; colorIndex?: number }) {
  const color = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-semibold flex-shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.34 }}
    >
      {initials}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({
  title, subtitle, action,
}: {
  title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({
  label, value, color = '#1e3a8a', bg = '#eff6ff',
}: {
  label: string; value: string | number; color?: string; bg?: string;
}) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: bg, borderColor: `${color}22` }}>
      <p className="text-xs font-semibold mb-1" style={{ color, opacity: 0.7 }}>{label}</p>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ message, icon = '📭' }: { message: string; icon?: string }) {
  return (
    <div className="py-16 text-center text-gray-400">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
  );
}

// ─── Form Field ──────────────────────────────────────────────────────────────
export function FormField({
  label, required, children,
}: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${props.className ?? ''}`}
    />
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition ${props.className ?? ''}`}
    />
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      rows={3}
      className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition ${props.className ?? ''}`}
    />
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
export function Button({
  children, variant = 'primary', size = 'md', className = '', ...props
}: {
  children: React.ReactNode;
  variant?: BtnVariant;
  size?: 'sm' | 'md' | 'lg';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-blue-900 text-white hover:bg-blue-800 border-transparent',
    secondary: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
    success: 'bg-green-800 text-white hover:bg-green-700 border-transparent',
    ghost: 'bg-transparent text-blue-700 hover:bg-blue-50 border-transparent',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-sm' };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-lg border transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// ─── Totals Box ───────────────────────────────────────────────────────────────
export function TotalsBox({
  subtotal, tax, taxRate, total,
}: {
  subtotal: number; tax: number; taxRate: number; total: number;
}) {
  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg text-right text-sm space-y-1">
      <div className="text-gray-500">Subtotal: <span className="font-semibold text-gray-800">R$ {fmt(subtotal)}</span></div>
      <div className="text-gray-500">Impostos ({taxRate}%): <span className="font-semibold text-gray-800">R$ {fmt(tax)}</span></div>
      <div className="pt-2 border-t border-gray-200 text-lg font-bold text-blue-900">
        Total: R$ {fmt(total)}
      </div>
    </div>
  );
}
