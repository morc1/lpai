import { useState } from 'react';
import { examples } from './data/examples';
import { solveSimplex, type LPProblem, type LPSolution } from './solver/simplex';
import type { LPExample } from './data/examples';
import './App.css';

function App() {
  const [selectedExample, setSelectedExample] = useState<LPExample | null>(null);
  const [solution, setSolution] = useState<LPSolution | null>(null);
  const [solving, setSolving] = useState(false);
  const [showTheory, setShowTheory] = useState(false);
  const [userProblem, setUserProblem] = useState('');

  const handleSolve = (problem: LPProblem) => {
    setSolving(true);
    setSolution(null);
    // Small delay to show animation
    setTimeout(() => {
      const result = solveSimplex(problem);
      setSolution(result);
      setSolving(false);
    }, 300);
  };

  const handleSelectExample = (example: LPExample) => {
    if (selectedExample?.id === example.id) {
      setSelectedExample(null);
      setSolution(null);
    } else {
      setSelectedExample(example);
      setSolution(null);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Lineær Programmering</h1>
        <p className="subtitle">Interaktiv solver med klassiske eksempler</p>
      </header>

      <nav className="tabs">
        <button
          className={!showTheory ? 'active' : ''}
          onClick={() => setShowTheory(false)}
        >
          Eksempler
        </button>
        <button
          className={showTheory ? 'active' : ''}
          onClick={() => setShowTheory(true)}
        >
          Teori
        </button>
      </nav>

      {showTheory ? (
        <main className="theory">
          <section className="theory-card">
            <h2>Hvad er lineær programmering?</h2>
            <p>
              Lineær programmering (LP) er en matematisk metode til at finde den bedste
              løsning i situationer hvor der er afveksling mellem forskellige mål og
              begrænsninger. "Lineær" betyder at alle relationer er rette linjer, og
              "programmering" refererer til planlægning.
            </p>
          </section>

          <section className="theory-card">
            <h2>Struktur</h2>
            <div className="formula-box">
              <div className="formula-label">Målfunktion</div>
              <code>Maximer/Minimer: c1*x1 + c2*x2 + ... + cn*xn</code>
            </div>
            <div className="formula-box">
              <div className="formula-label">Begrænsninger</div>
              <code>a1*x1 + a2*x2 + ... + an*xn &lt;= b (eller &gt;=, =)</code>
              <code>x1, x2, ..., xn &gt;= 0</code>
            </div>
          </section>

          <section className="theory-card">
            <h2>Variable</h2>
            <p>
              Variable (x1, x2, ...) er de ting du kan justere. Det kunne være:
            </p>
            <ul>
              <li>Hvor meget af hver vare du producerer</li>
              <li>Hvor meget du køber af hver råvare</li>
              <li>Hvor mange ansatte der starter på hver dag</li>
            </ul>
          </section>

          <section className="theory-card">
            <h2>Begrænsninger</h2>
            <p>
              Begrænsninger er de grænser dit system har. De kommer ofte fra:
            </p>
            <ul>
              <li>Ressourcer (tid, materialer, penge)</li>
              <li>Krav (mindst 100g protein, højst 50g fedt)</li>
              <li>Efterspørgsel (butikken skal have 30 stk)</li>
            </ul>
          </section>

          <section className="theory-card">
            <h2>Målfunktion</h2>
            <p>
              Målfunktionen er det du vil optimere. Typisk:
            </p>
            <ul>
              <li><strong>Minimer omkostninger</strong> — "Hvordan holder jeg prisen nede?"</li>
              <li><strong>Maksimer profit</strong> — "Hvordan tjener jeg mest?"</li>
            </ul>
          </section>
        </main>
      ) : (
        <main className="main-content">
          <section className="problem-formulator">
            <h2>Skriv dit eget problem</h2>
            <textarea
              value={userProblem}
              onChange={(e) => setUserProblem(e.target.value)}
              placeholder="Beskriv dit problem i daglig tale..."
            />
            {userProblem.length > 50 && (
              <div className="ai-hint">
                <span className="hint-icon">💡</span>
                <p>
                  AI kunne her identificere variable, begrænsninger og målfunktion.
                  Dette er en kommende feature!
                </p>
              </div>
            )}
          </section>

          <section className="examples-section">
            <h2>Klassiske eksempler</h2>
            <p className="examples-hint">
              Klik på et eksempel for at se problemet, og tryk "Løs" for at køre simplex-algoritmen.
            </p>
            <div className="examples-grid">
              {examples.map((example) => (
                <button
                  key={example.id}
                  className={`example-card ${selectedExample?.id === example.id ? 'selected' : ''}`}
                  onClick={() => handleSelectExample(example)}
                >
                  <h3>{example.title}</h3>
                  <p>{example.description.split('.')[0]}.</p>
                </button>
              ))}
            </div>
          </section>

          {selectedExample && (
            <section className="example-detail">
              <h2>{selectedExample.title}</h2>
              <p className="example-desc">{selectedExample.description}</p>

              <div className="detail-grid">
                <div className="detail-card variables">
                  <h4>Variable</h4>
                  <ul>
                    {selectedExample.variables.map((v) => (
                      <li key={v.name}>
                        <span className="var-name">{v.name}</span>
                        <span className="var-desc">{v.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="detail-card constraints">
                  <h4>Begrænsninger</h4>
                  <ul>
                    {selectedExample.constraints.map((c, i) => (
                      <li key={i}>
                        <span className="natural">{c.natural}</span>
                        <code className="formal">{c.formal}</code>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="detail-card objective">
                  <h4>Målfunktion</h4>
                  {selectedExample.objective.maximize && (
                    <p className="direction maximize">{selectedExample.objective.maximize}</p>
                  )}
                  {selectedExample.objective.minimize && (
                    <p className="direction minimize">{selectedExample.objective.minimize}</p>
                  )}
                  <code className="formal">{selectedExample.objective.formal}</code>
                </div>

                <div className="detail-card solver">
                  <h4>Simplex Solver</h4>
                  <button
                    className="solve-button"
                    onClick={() => handleSolve(selectedExample.problem)}
                    disabled={solving}
                  >
                    {solving ? 'Løser...' : 'Løs problemet'}
                  </button>

                  {solution && (
                    <div className="solution-result">
                      {solution.feasible ? (
                        <>
                          <div className="solution-status success">
                            {solution.message}
                          </div>
                          <ul className="solution-vars">
                            {solution.variables.map((val, idx) => (
                              <li key={idx}>
                                <span className="var-name">{selectedExample.variables[idx]?.name || `x${idx + 1}`}</span>
                                <span className="var-value">
                                  = {val.toFixed(2)} {selectedExample.variables[idx]?.unit || ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <div className="solution-obj">
                            {selectedExample.objective.maximize && (
                              <span>Maksimeret værdi: </span>
                            )}
                            {selectedExample.objective.minimize && (
                              <span>Minimeret værdi: </span>
                            )}
                            <strong>{solution.objective.toFixed(2)}</strong>
                          </div>
                        </>
                      ) : (
                        <div className="solution-status error">
                          {solution.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  );
}

export default App;