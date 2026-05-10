// Simplex solver for linear programming problems
// Supports both maximization and minimization

export interface LPProblem {
  objective: 'max' | 'min';
  coefficients: number[];  // objective function coefficients (c)
  constraints: number[][]; // constraint coefficients (A)
  bounds: number[];        // right-hand side values (b)
  relations: ('<=' | '>=' | '=')[];
}

export interface LPSolution {
  feasible: boolean;
  optimal: boolean;
  objective: number;
  variables: number[];
  iterations: number;
  message: string;
}

/**
 * Converts a maximization problem to minimization form
 * or vice versa by negating objective coefficients
 */
function convertObjective(obj: 'max' | 'min', coeffs: number[]): { objective: 'max' | 'min'; coefficients: number[] } {
  if (obj === 'min') {
    return { objective: 'max', coefficients: coeffs.map(c => -c) };
  }
  return { objective: obj, coefficients: coeffs };
}

/**
 * Solves a linear programming problem using the simplex method.
 * 
 * Standard form after conversion:
 *   Maximize: c^T * x
 *   Subject to: Ax <= b
 *               x >= 0
 * 
 * This is a two-phase simplex implementation that handles:
 * - <=, >=, = constraints
 * - Both maximization and minimization
 */
export function solveSimplex(problem: LPProblem): LPSolution {
  // Convert minimization to maximization
  const converted = convertObjective(problem.objective, problem.coefficients);
  const obj = converted.objective;
  const c = converted.coefficients;
  const A = problem.constraints.map(row => [...row]);
  const b = [...problem.bounds];
  const relations = [...problem.relations];

  const numVars = c.length;
  const numConstraints = A.length;

  // Step 1: Convert to standard form by adding slack/surplus/artificial variables
  const tableau: number[][] = [];
  const basicVars: number[] = []; // indices of basic variables
  let slackIdx = numVars;
  let artificialVars: number[] = [];

  // Add objective row initially
  const objRow: number[] = [...c.map(coef => -coef), 0];

  for (let i = 0; i < numConstraints; i++) {
    const row: number[] = [...A[i]];
    const rhs = b[i];

    if (relations[i] === '<=') {
      // Add slack variable (+1)
      for (let j = 0; j < numConstraints; j++) {
        row.push(i === j ? 1 : 0);
      }
      // Extend objective row
      while (objRow.length < row.length + 1) objRow.push(0);
      row.push(rhs);
      tableau.push(row);
      basicVars.push(slackIdx + i);
    } else if (relations[i] === '>=') {
      // Add surplus (-1) and artificial (+1)
      for (let j = 0; j < numConstraints; j++) {
        row.push(i === j ? -1 : 0); // surplus
      }
      row.push(1); // artificial variable
      // Extend objective row
      while (objRow.length < row.length + 1) objRow.push(0);
      row.push(rhs);
      tableau.push(row);
      basicVars.push(row.length - 2); // artificial variable index
      artificialVars.push(row.length - 2);
    } else if (relations[i] === '=') {
      // Add artificial variable (+1)
      for (let j = 0; j < numConstraints; j++) {
        row.push(0);
      }
      row.push(1); // artificial variable
      // Extend objective row
      while (objRow.length < row.length + 1) objRow.push(0);
      row.push(rhs);
      tableau.push(row);
      basicVars.push(row.length - 2); // artificial variable index
      artificialVars.push(row.length - 2);
    }
  }

  // Pad all rows to same length
  const totalCols = Math.max(...tableau.map(r => r.length), objRow.length);
  for (const row of tableau) {
    while (row.length < totalCols) row.push(0);
  }
  while (objRow.length < totalCols) objRow.push(0);

  // Phase 1: If artificial variables exist, minimize their sum
  if (artificialVars.length > 0) {
    const phase1Obj = new Array(totalCols).fill(0);
    for (const av of artificialVars) {
      phase1Obj[av] = 1;
    }

    // Build phase 1 tableau
    const p1Tableau = tableau.map(r => [...r]);
    p1Tableau.push([...phase1Obj, 0]);

    // Make objective row consistent with basis
    for (let i = 0; i < numConstraints; i++) {
      if (artificialVars.includes(basicVars[i])) {
        for (let j = 0; j < totalCols; j++) {
          p1Tableau[numConstraints][j] -= p1Tableau[i][j];
        }
      }
    }

    // Solve phase 1
    const p1Result = simplexIterate(p1Tableau, basicVars, numConstraints);
    
    if (Math.abs(p1Result.tableau[numConstraints][totalCols - 1]) > 1e-6) {
      return {
        feasible: false,
        optimal: false,
        objective: 0,
        variables: [],
        iterations: p1Result.iterations,
        message: 'Problem is infeasible',
      };
    }

    // Extract feasible basis for phase 2
    // Remove artificial variable columns
    const phase2Tableau = p1Result.tableau.slice(0, numConstraints).map(row => {
      const newRow = [];
      for (let j = 0; j < totalCols; j++) {
        if (!artificialVars.includes(j)) {
          newRow.push(row[j]);
        }
      }
      return newRow;
    });

    // Rebuild objective for phase 2
    const phase2Obj = [];
    for (let j = 0; j < totalCols; j++) {
      if (!artificialVars.includes(j)) {
        phase2Obj.push(objRow[j]);
      }
    }

    // Adjust basic variables indices
    const phase2Basic = p1Result.basic.map(bv => {
      let offset = 0;
      for (const av of artificialVars) {
        if (av < bv) offset++;
      }
      return bv - offset;
    }).filter(bv => bv >= 0);

    const phase2Cols = phase2Obj.length;
    
    // Make objective row consistent
    for (let i = 0; i < numConstraints; i++) {
      const bv = phase2Basic[i];
      if (bv < numVars) { // original variable in basis
        const coef = phase2Obj[bv];
        for (let j = 0; j < phase2Cols; j++) {
          phase2Obj[j] -= coef * phase2Tableau[i][j];
        }
      }
    }

    phase2Tableau.push(phase2Obj);
    
    const p2Result = simplexIterate(phase2Tableau, phase2Basic, numConstraints);
    return extractSolution(p2Result, numVars, obj, p2Result.iterations);
  }

  // No artificial variables - solve directly
  tableau.push(objRow);
  const result = simplexIterate(tableau, basicVars, numConstraints);
  return extractSolution(result, numVars, obj, result.iterations);
}

function simplexIterate(tableau: number[][], basicVars: number[], numConstraints: number): { tableau: number[][]; basic: number[]; iterations: number } {
  let iterations = 0;
  const maxIterations = 1000;
  const numCols = tableau[0].length;
  const objRow = numConstraints;

  while (iterations < maxIterations) {
    iterations++;

    // Find entering variable (most negative in objective row)
    let entering = -1;
    let minVal = -1e-9;
    for (let j = 0; j < numCols - 1; j++) {
      if (tableau[objRow][j] < minVal) {
        minVal = tableau[objRow][j];
        entering = j;
      }
    }

    if (entering === -1) {
      // Optimal solution found
      return { tableau, basic: basicVars, iterations };
    }

    // Find leaving variable (minimum ratio test)
    let leaving = -1;
    let minRatio = Infinity;

    for (let i = 0; i < numConstraints; i++) {
      const coeff = tableau[i][entering];
      if (coeff > 1e-9) {
        const ratio = tableau[i][numCols - 1] / coeff;
        if (ratio < minRatio - 1e-9 || (Math.abs(ratio - minRatio) < 1e-9 && basicVars[i] < basicVars[leaving])) {
          minRatio = ratio;
          leaving = i;
        }
      }
    }

    if (leaving === -1) {
      // Unbounded
      return { tableau, basic: basicVars, iterations };
    }

    // Pivot
    const pivot = tableau[leaving][entering];
    for (let j = 0; j < numCols; j++) {
      tableau[leaving][j] /= pivot;
    }

    for (let i = 0; i <= numConstraints; i++) {
      if (i !== leaving) {
        const factor = tableau[i][entering];
        if (Math.abs(factor) > 1e-9) {
          for (let j = 0; j < numCols; j++) {
            tableau[i][j] -= factor * tableau[leaving][j];
          }
        }
      }
    }

    basicVars[leaving] = entering;
  }

  return { tableau, basic: basicVars, iterations };
}

function extractSolution(result: { tableau: number[][]; basic: number[] }, numVars: number, objType: 'max' | 'min', iterations: number): LPSolution {
  const tableau = result.tableau;
  const basicVars = result.basic;
  const numCols = tableau[0].length;
  const objRow = tableau.length - 1;

  const variables: number[] = new Array(numVars).fill(0);

  for (let i = 0; i < basicVars.length; i++) {
    if (basicVars[i] < numVars) {
      variables[basicVars[i]] = tableau[i][numCols - 1];
    }
  }

  let objective = tableau[objRow][numCols - 1];
  if (objType === 'min') {
    objective = -objective;
  }

  return {
    feasible: true,
    optimal: true,
    objective,
    variables,
    iterations,
    message: `Optimal solution found in ${iterations} iterations`,
  };
}

/**
 * Parse a simple LP problem from coefficients
 */
export function createProblem(
  objective: 'max' | 'min',
  objCoeffs: number[],
  constraints: { coeffs: number[]; relation: '<=' | '>=' | '='; bound: number }[]
): LPProblem {
  return {
    objective,
    coefficients: objCoeffs,
    constraints: constraints.map(c => c.coeffs),
    bounds: constraints.map(c => c.bound),
    relations: constraints.map(c => c.relation),
  };
}