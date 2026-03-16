function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export type DemoTabBarVariant = 'primary' | 'secondary'

export type DemoTabItem = {
  value: string
  label: string
}

type DemoTabBarProps = {
  variant: DemoTabBarVariant
  tabs: DemoTabItem[]
  activeValue: string
  onChange: (value: string) => void
  'aria-label': string
  className?: string
}

/**
 * Reusable tab bar for demo screens. Styled like image 2:
 * - primary: panel-style tabs, active has background and rounded top, connects to content below
 * - secondary: text tabs, active = blue text + underline; hover = visible feedback
 */
export function DemoTabBar({
  variant,
  tabs,
  activeValue,
  onChange,
  'aria-label': ariaLabel,
  className,
}: DemoTabBarProps) {
  const containerClass = cx(
    variant === 'primary' ? 'demoPrimaryTabs' : 'demoSecondaryTabs',
    className,
  )
  const tabClass = (isActive: boolean) =>
    cx(
      variant === 'primary' ? 'demoPrimaryTab' : 'demoSecondaryTab',
      isActive && (variant === 'primary' ? 'demoPrimaryTabActive' : 'demoSecondaryTabActive'),
    )

  return (
    <div role="tablist" aria-label={ariaLabel} className={containerClass}>
      {tabs.map((tab) => {
        const isActive = activeValue === tab.value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.value}`}
            id={`tab-${tab.value}`}
            className={tabClass(isActive)}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
