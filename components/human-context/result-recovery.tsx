export function HumanContextResultRecovery({ message, onReturn }: { message: string; onReturn: () => void }) {
  return (
    <section role="alert" className="rounded-2xl border border-[#ffb36d]/40 bg-[#ffb36d]/10 p-6">
      <h2 className="text-xl font-black text-white">Die Momentaufnahme ist noch nicht vollständig.</h2>
      <p className="mt-3 leading-7 text-[#ffd3a8]">{message}</p>
      <button type="button" onClick={onReturn} className="mt-5 min-h-11 rounded-full border border-white/20 px-5 font-bold text-white">Zu den offenen Angaben</button>
    </section>
  );
}
