/**
 * Scenario selector — SOC and GuardianX options.
 * Futuristic Ironman Lab style.
 */
import { SOC_OPTIONS, GUARDIANX_OPTIONS, type ScenarioOption } from './scenarioCatalog'

type ScenarioSelectorProps = {
  onSelect: (option: ScenarioOption) => void
  disabled?: boolean
  activeId?: string | null
}

function OptionButton({
  option,
  onClick,
  disabled,
  isActive,
}: {
  option: ScenarioOption
  onClick: () => void
  disabled?: boolean
  isActive?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium
        transition-all duration-200 border
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isActive
          ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
          : 'bg-slate-800/40 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-cyan-500/30 hover:text-cyan-200'
        }
      `}
    >
      <span className="font-mono text-[10px] text-cyan-400/80 mr-2">›</span>
      {option.label}
    </button>
  )
}

function Section({
  title,
  options,
  onSelect,
  disabled,
  activeId,
}: {
  title: string
  options: ScenarioOption[]
  onSelect: (o: ScenarioOption) => void
  disabled?: boolean
  activeId?: string | null
}) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/70 px-1">
        {title}
      </div>
      <div className="space-y-1.5">
        {options.map((opt) => (
          <OptionButton
            key={opt.id}
            option={opt}
            onClick={() => onSelect(opt)}
            disabled={disabled}
            isActive={activeId === opt.id}
          />
        ))}
      </div>
    </div>
  )
}

export function ScenarioSelector({
  onSelect,
  disabled = false,
  activeId = null,
}: ScenarioSelectorProps) {
  return (
    <div className="space-y-5">
      <Section
        title="SOC System"
        options={SOC_OPTIONS}
        onSelect={onSelect}
        disabled={disabled}
        activeId={activeId}
      />
      {/* <Section
        title="GuardianX System"
        options={GUARDIANX_OPTIONS}
        onSelect={onSelect}
        disabled={disabled}
        activeId={activeId}
      /> */}
    </div>
  )
}
