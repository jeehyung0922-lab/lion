/** 콜렉트북 (타 담당 · 지형) — GNB 연결용 플레이스홀더 */
export default function CollectbookPage() {
  return <Placeholder title="콜렉트북" owner="지형" />
}

function Placeholder({ title, owner }: { title: string; owner: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-5 text-center">
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="text-sm" style={{ color: 'var(--color-ink-faint)' }}>
        담당: {owner} · 화면 준비 중
      </p>
    </div>
  )
}
