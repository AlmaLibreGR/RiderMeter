"use client";

import Link from "next/link";
import {
  CalendarDays,
  CircleAlert,
  Coins,
  FileText,
  MapPin,
  Package,
  Route,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

type ShiftForm = {
  date: string;
  platform: string;
  area: string;
  hours: string;
  ordersCount: string;
  kilometers: string;
  platformEarnings: string;
  tipsCard: string;
  tipsCash: string;
  bonus: string;
  notes: string;
};

type ShiftFormErrors = Partial<Record<keyof ShiftForm, string>>;

type FeedbackState =
  | {
      type: "success" | "error";
      text: string;
    }
  | null;

const initialForm: ShiftForm = {
  date: new Date().toISOString().slice(0, 10),
  platform: "efood",
  area: "",
  hours: "",
  ordersCount: "",
  kilometers: "",
  platformEarnings: "",
  tipsCard: "",
  tipsCash: "",
  bonus: "",
  notes: "",
};

export default function NewShiftPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [form, setForm] = useState<ShiftForm>(initialForm);
  const [errors, setErrors] = useState<ShiftFormErrors>({});
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const response = await fetch("/api/me");
      setAuthorized(response.ok);
    }

    void checkAuth();
  }, []);

  function updateField(name: keyof ShiftForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  }

  function parseNumber(value: string) {
    if (!value.trim()) {
      return 0;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  function validateForm() {
    const nextErrors: ShiftFormErrors = {};

    if (!form.date) {
      nextErrors.date = "Χρειάζεται ημερομηνία βάρδιας.";
    }

    if (!form.area.trim()) {
      nextErrors.area =
        "Συμπλήρωσε περιοχή για να ξεχωρίζεις εύκολα τις βάρδιες στο ιστορικό.";
    }

    const hours = parseNumber(form.hours);
    if (!Number.isFinite(hours) || hours <= 0) {
      nextErrors.hours = "Οι ώρες πρέπει να είναι μεγαλύτερες από το μηδέν.";
    }

    const ordersCount = parseNumber(form.ordersCount);
    if (!Number.isFinite(ordersCount) || ordersCount < 0) {
      nextErrors.ordersCount = "Οι παραγγελίες δεν μπορούν να είναι αρνητικές.";
    }

    const kilometers = parseNumber(form.kilometers);
    if (!Number.isFinite(kilometers) || kilometers < 0) {
      nextErrors.kilometers = "Τα χιλιόμετρα δεν μπορούν να είναι αρνητικά.";
    }

    const monetaryFields: Array<keyof ShiftForm> = [
      "platformEarnings",
      "tipsCard",
      "tipsCash",
      "bonus",
    ];

    monetaryFields.forEach((field) => {
      const value = parseNumber(form[field]);

      if (!Number.isFinite(value) || value < 0) {
        nextErrors[field] = "Το ποσό πρέπει να είναι μη αρνητικός αριθμός.";
      }
    });

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);

    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFeedback({
        type: "error",
        text: "Υπάρχουν πεδία που χρειάζονται διόρθωση πριν την αποθήκευση.",
      });
      return;
    }

    setLoading(true);

    const payload = {
      ...form,
      area: form.area.trim(),
      notes: form.notes.trim(),
    };

    const response = await fetch("/api/shifts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.ok) {
      setFeedback({
        type: "success",
        text: "Η βάρδια αποθηκεύτηκε επιτυχώς. Μπορείς να συνεχίσεις με την επόμενη.",
      });
      setForm(initialForm);
      setErrors({});
    } else {
      setFeedback({
        type: "error",
        text: data.error || "Κάτι πήγε στραβά κατά την αποθήκευση της βάρδιας.",
      });
    }

    setLoading(false);
  }

  if (authorized === null) {
    return <main className="min-h-screen p-6 text-slate-600">Φόρτωση...</main>;
  }

  if (!authorized) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <h1 className="text-3xl font-semibold text-slate-900">Νέα βάρδια</h1>
          <p className="mt-3 text-slate-600">
            Πρέπει να συνδεθείς για να καταχωρίσεις νέα βάρδια.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white"
            >
              Σύνδεση
            </Link>
            <Link
              href="/register"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900"
            >
              Εγγραφή
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const grossRevenue =
    parseNumber(form.platformEarnings) +
    parseNumber(form.tipsCard) +
    parseNumber(form.tipsCash) +
    parseNumber(form.bonus);
  const hoursValue = parseNumber(form.hours);
  const grossPerHour =
    Number.isFinite(hoursValue) && hoursValue > 0 ? grossRevenue / hoursValue : 0;

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-white/70 bg-white/78 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Core flow · Νέα βάρδια
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Καταχώρισε τη βάρδια σου χωρίς να χαθείς σε λεπτομέρειες
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Δώσε πρώτα τα βασικά, μετά τα έσοδα και τέλος ό,τι σημειώσεις θες
                να θυμάσαι. Η φόρμα είναι οργανωμένη για γρήγορη χρήση από κινητό.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white"
                >
                  Επιστροφή στο dashboard
                </Link>
                <Link
                  href="/history"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900"
                >
                  Προβολή ιστορικού
                </Link>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:w-[360px] xl:grid-cols-1">
              <PreviewCard
                label="Εκτιμώμενα μικτά"
                value={formatCurrency(grossRevenue)}
                helper="Άθροισμα πλατφόρμας, tips και bonus."
                icon={Wallet}
              />
              <PreviewCard
                label="Μικτά / ώρα"
                value={formatCurrency(grossPerHour)}
                helper="Υπολογίζεται ζωντανά όσο συμπληρώνεις."
                icon={Coins}
              />
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <div className="space-y-6">
            <FormSection
              eyebrow="Βασικά στοιχεία"
              title="Πότε, πού και σε ποια πλατφόρμα"
              description="Ξεκίνα από τα στοιχεία που θα σε βοηθήσουν να βρεις εύκολα τη βάρδια σου αργότερα."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field icon={CalendarDays} label="Ημερομηνία" error={errors.date}>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => updateField("date", event.target.value)}
                    className={inputClass(errors.date)}
                  />
                </Field>

                <Field
                  icon={Package}
                  label="Πλατφόρμα"
                  helper="Αν δούλεψες και στα δύο, κράτησέ το σε μία καταχώριση."
                >
                  <select
                    value={form.platform}
                    onChange={(event) => updateField("platform", event.target.value)}
                    className={inputClass()}
                  >
                    <option value="efood">efood</option>
                    <option value="wolt">Wolt</option>
                    <option value="both">efood + Wolt</option>
                  </select>
                </Field>
              </div>

              <Field
                icon={MapPin}
                label="Περιοχή"
                helper="Π.χ. Μαρούσι, Κέντρο ή Περιστέρι."
                error={errors.area}
              >
                <input
                  type="text"
                  value={form.area}
                  onChange={(event) => updateField("area", event.target.value)}
                  className={inputClass(errors.area)}
                  placeholder="Π.χ. Μαρούσι"
                />
              </Field>
            </FormSection>

            <FormSection
              eyebrow="Απόδοση"
              title="Χρόνος, παραγγελίες και διαδρομή"
              description="Αυτά τα στοιχεία σε βοηθούν να συγκρίνεις ρυθμό, παραγωγικότητα και effort."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <NumberField
                  icon={Wallet}
                  label="Ώρες"
                  value={form.hours}
                  onChange={(value) => updateField("hours", value)}
                  error={errors.hours}
                  placeholder="0.00"
                />
                <NumberField
                  icon={Package}
                  label="Παραγγελίες"
                  value={form.ordersCount}
                  onChange={(value) => updateField("ordersCount", value)}
                  error={errors.ordersCount}
                  placeholder="0"
                />
                <NumberField
                  icon={Route}
                  label="Χιλιόμετρα"
                  value={form.kilometers}
                  onChange={(value) => updateField("kilometers", value)}
                  error={errors.kilometers}
                  placeholder="0.00"
                />
              </div>
            </FormSection>

            <FormSection
              eyebrow="Έσοδα"
              title="Πόσα έφερε η βάρδια"
              description="Συμπλήρωσε πλατφόρμα, tips και bonus για να εμφανιστούν καθαρότερα τα μικτά σου."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <NumberField
                  icon={Coins}
                  label="Έσοδα πλατφόρμας (€)"
                  value={form.platformEarnings}
                  onChange={(value) => updateField("platformEarnings", value)}
                  error={errors.platformEarnings}
                  placeholder="0.00"
                />
                <NumberField
                  icon={Wallet}
                  label="Tips κάρτα (€)"
                  value={form.tipsCard}
                  onChange={(value) => updateField("tipsCard", value)}
                  error={errors.tipsCard}
                  placeholder="0.00"
                />
                <NumberField
                  icon={Wallet}
                  label="Tips μετρητά (€)"
                  value={form.tipsCash}
                  onChange={(value) => updateField("tipsCash", value)}
                  error={errors.tipsCash}
                  placeholder="0.00"
                />
                <NumberField
                  icon={Coins}
                  label="Bonus (€)"
                  value={form.bonus}
                  onChange={(value) => updateField("bonus", value)}
                  error={errors.bonus}
                  placeholder="0.00"
                />
              </div>
            </FormSection>

            <FormSection
              eyebrow="Σημειώσεις"
              title="Κράτα ό,τι θες να θυμάσαι"
              description="Π.χ. βροχή, χαμηλή διαθεσιμότητα, μεγάλη αναμονή ή δυνατή ζήτηση."
            >
              <Field icon={FileText} label="Σημειώσεις" helper="Προαιρετικό πεδίο.">
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  className={`${inputClass()} min-h-[130px]`}
                  placeholder="Ό,τι έχει νόημα να θυμάσαι για αυτή τη βάρδια"
                />
              </Field>
            </FormSection>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[32px] border border-white/70 bg-white/78 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
              <h2 className="text-xl font-semibold text-slate-950">Πριν αποθηκεύσεις</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <ChecklistItem
                  done={Boolean(form.area.trim())}
                  text="Η περιοχή είναι σωστή και αναγνωρίσιμη."
                />
                <ChecklistItem
                  done={Number.isFinite(hoursValue) && hoursValue > 0}
                  text="Οι ώρες έχουν νόημα για τη βάρδια που γράφεις."
                />
                <ChecklistItem
                  done={Object.keys(errors).length === 0}
                  text="Δεν υπάρχουν προφανή λάθη σε ποσά ή αριθμούς."
                />
              </div>

              {feedback ? (
                <div
                  className={`mt-5 rounded-3xl border p-4 text-sm leading-6 ${
                    feedback.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-rose-200 bg-rose-50 text-rose-900"
                  }`}
                >
                  {feedback.text}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white disabled:opacity-60"
              >
                {loading ? "Αποθήκευση..." : "Αποθήκευση βάρδιας"}
              </button>
            </section>

            <section className="rounded-[32px] border border-amber-200 bg-amber-50/80 p-5 text-sm leading-6 text-amber-950 shadow-sm">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 shrink-0" size={18} />
                <p>
                  Στο πρώτο pass κρατάμε το ίδιο API και το ίδιο data model. Οι
                  βελτιώσεις εδώ είναι κυρίως στην εμπειρία συμπλήρωσης και στην
                  αποφυγή προφανών λαθών πριν το submit.
                </p>
              </div>
            </section>
          </aside>
        </form>
      </div>
    </main>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}

function PreviewCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof Wallet;
}) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon size={16} />
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </div>
  );
}

function FormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-white/70 bg-white/78 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur md:p-6">
      <div className="mb-5">
        <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {eyebrow}
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  icon: Icon,
  label,
  helper,
  error,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        <Icon size={15} />
        {label}
      </div>
      {children}
      <p className={`mt-2 text-sm ${error ? "text-rose-600" : "text-slate-500"}`}>
        {error || helper || " "}
      </p>
    </div>
  );
}

function NumberField({
  icon,
  label,
  value,
  onChange,
  error,
  placeholder,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder: string;
}) {
  return (
    <Field icon={icon} label={label} error={error}>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass(error)}
        placeholder={placeholder}
      />
    </Field>
  );
}

function ChecklistItem({ done, text }: { done: boolean; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
      <span
        className={`mt-1 h-2.5 w-2.5 rounded-full ${
          done ? "bg-emerald-500" : "bg-slate-300"
        }`}
      />
      <p>{text}</p>
    </div>
  );
}

function inputClass(error?: string) {
  return `w-full rounded-2xl border bg-white px-4 py-3 text-base text-slate-900 ${
    error ? "border-rose-300 bg-rose-50/30" : "border-slate-300"
  }`;
}
