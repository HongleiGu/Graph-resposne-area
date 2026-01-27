import React from 'react'

interface EvaluationConfigPanelProps<T extends Record<string, any>> {
  config: T
  setConfig: React.Dispatch<React.SetStateAction<T>>
  configOpen: boolean
  setConfigOpen: React.Dispatch<React.SetStateAction<boolean>>
  classes: Record<string, string>
}

export default function EvaluationConfigPanel<T extends Record<string, any>>({
  config,
  setConfig,
  configOpen,
  setConfigOpen,
  classes,
}: EvaluationConfigPanelProps<T>) {
  return (
    <div className={classes.floatingConfig}>
      <div
        className={classes.configHeader}
        onClick={() => setConfigOpen((o) => !o)}
      >
        <span>Evaluation Config</span>
        <span>{configOpen ? '▾' : '▸'}</span>
      </div>

      {configOpen && (
        <div className={classes.configBody}>
          {Object.entries(config).map(([key, value]) => (
            <div key={key} className={classes.field}>
              <label>{key}</label>

              {typeof value === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                />
              ) : typeof value === 'number' ? (
                <input
                  type="number"
                  className={classes.inputField}
                  value={value}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      [key]: Number(e.target.value),
                    }))
                  }
                />
              ) : (
                <input
                  className={classes.inputField}
                  value={String(value)}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
