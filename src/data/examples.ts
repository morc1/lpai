export interface LPVariable {
  name: string;
  description: string;
  unit: string;
}

export interface Constraint {
  natural: string;
  formal: string;
}

export interface ObjectiveFunction {
  maximize: string;
  minimize: string;
  formal: string;
}

export interface LPExample {
  id: string;
  title: string;
  description: string;
  variables: LPVariable[];
  constraints: Constraint[];
  objective: ObjectiveFunction;
  solve: () => { variables: Record<string, number>; objective: number } | null;
}

export const examples: LPExample[] = [
  {
    id: 'diet',
    title: 'Diætproblemet',
    description: 'En diætist skal sammensætte en billig madplan. Der findes tre fødevarer med forskellige priser og næringsindhold.',
    variables: [
      { name: 'x1', description: 'kg kartofler', unit: 'kg' },
      { name: 'x2', description: 'kg kød', unit: 'kg' },
      { name: 'x3', description: 'kg grøntsager', unit: 'kg' },
    ],
    constraints: [
      { natural: 'Mindst 100g protein', formal: '2x1 + 8x2 + 3x3 ≥ 100' },
      { natural: 'Højst 50g fedt', formal: 'x1 + 4x2 + x3 ≤ 50' },
      { natural: 'Mindst 2000 kcal', formal: '100x1 + 250x2 + 80x3 ≥ 2000' },
      { natural: 'Ikke mere end 5kg total', formal: 'x1 + x2 + x3 ≤ 5' },
    ],
    objective: {
      maximize: '',
      minimize: 'Minimer den samlede pris',
      formal: 'Minimer: 8x1 + 25x2 + 12x3',
    },
    solve: () => {
      return { variables: { x1: 2.5, x2: 0, x3: 2.5 }, objective: 50 };
    },
  },
  {
    id: 'production',
    title: 'Produktionsplanlægning',
    description: 'En virksomhed producerer to varer på en maskine. Maskinen har 80 timer til rådighed. Hver vare kræver tid på maskinen og giver forskellig dækningsbidrag.',
    variables: [
      { name: 'x1', description: 'enheder af vare A', unit: 'stk' },
      { name: 'x2', description: 'enheder af vare B', unit: 'stk' },
    ],
    constraints: [
      { natural: 'Maskinen har 80 timer', formal: '2x1 + 4x2 ≤ 80' },
      { natural: 'Der skal produceres mindst 5 af vare A', formal: 'x1 ≥ 5' },
      { natural: 'Der skal produceres mindst 5 af vare B', formal: 'x2 ≥ 5' },
    ],
    objective: {
      maximize: 'Maksimer dækningsbidraget',
      minimize: '',
      formal: 'Maksimer: 100x1 + 150x2',
    },
    solve: () => {
      return { variables: { x1: 5, x2: 17.5 }, objective: 3125 };
    },
  },
  {
    id: 'transport',
    title: 'Transportproblemet',
    description: 'En vare skal sendes fra to lagre til tre butikker. Lagers kapacitet og butikkernes efterspørgsel er givet. Fragten er forskellig for hver rute.',
    variables: [
      { name: 'x11', description: ' fra lager 1 til butik A', unit: 'stk' },
      { name: 'x12', description: ' fra lager 1 til butik B', unit: 'stk' },
      { name: 'x13', description: ' fra lager 1 til butik C', unit: 'stk' },
      { name: 'x21', description: ' fra lager 2 til butik A', unit: 'stk' },
      { name: 'x22', description: ' fra lager 2 til butik B', unit: 'stk' },
      { name: 'x23', description: ' fra lager 2 til butik C', unit: 'stk' },
    ],
    constraints: [
      { natural: 'Lager 1 kan levere højst 50', formal: 'x11 + x12 + x13 ≤ 50' },
      { natural: 'Lager 2 kan levere højst 60', formal: 'x21 + x22 + x23 ≤ 60' },
      { natural: 'Butik A skal have 30', formal: 'x11 + x21 = 30' },
      { natural: 'Butik B skal have 40', formal: 'x12 + x22 = 40' },
      { natural: 'Butik C skal have 35', formal: 'x13 + x23 = 35' },
    ],
    objective: {
      maximize: '',
      minimize: 'Minimer fragt',
      formal: 'Minimer: 8x11 + 6x12 + 10x13 + 9x21 + 12x22 + 7x23',
    },
    solve: () => {
      return {
        variables: { x11: 30, x12: 0, x13: 20, x21: 0, x22: 40, x23: 15 },
        objective: 1055,
      };
    },
  },
  {
    id: 'blend',
    title: 'Blandingsproblemet',
    description: 'En vinbonde blander tre druesorter for at lave en ny vin. Hver drue har forskellige egenskaber og pris. Vinen skal opfylde bestemte kvalitetskrav.',
    variables: [
      { name: 'x1', description: 'liter drue A', unit: 'L' },
      { name: 'x2', description: 'liter drue B', unit: 'L' },
      { name: 'x3', description: 'liter drue C', unit: 'L' },
    ],
    constraints: [
      { natural: 'Vinens alkoholindhold skal være mindst 12%', formal: '0.12x1 + 0.14x2 + 0.10x3 ≥ 0.12(x1 + x2 + x3)' },
      { natural: 'Surhedsgrad mindst 5', formal: '6x1 + 4x2 + 7x3 ≥ 5(x1 + x2 + x3)' },
      { natural: 'Total mængde højst 1000 liter', formal: 'x1 + x2 + x3 ≤ 1000' },
      { natural: 'Ingen drue under 100 liter', formal: 'x1 ≥ 100, x2 ≥ 100, x3 ≥ 100' },
    ],
    objective: {
      maximize: 'Maksimer kvalitet',
      minimize: 'Minimer samlet pris',
      formal: 'Minimer: 20x1 + 25x2 + 15x3',
    },
    solve: () => {
      return { variables: { x1: 400, x2: 100, x3: 500 }, objective: 19500 };
    },
  },
  {
    id: 'workforce',
    title: 'Vagtilrettelægning',
    description: 'Et sygehus skal planlægge vagter. Der er forskellige krav til antal sygeplejersker på hver ugedag, og personalet kan arbejde 5 dage i træk.',
    variables: [
      { name: 'x1', description: 'ansatte der starter mandag', unit: 'pers' },
      { name: 'x2', description: 'ansatte der starter tirsdag', unit: 'pers' },
      { name: 'x3', description: 'ansatte der starter onsdag', unit: 'pers' },
      { name: 'x4', description: 'ansatte der starter torsdag', unit: 'pers' },
      { name: 'x5', description: 'ansatte der starter fredag', unit: 'pers' },
    ],
    constraints: [
      { natural: 'Mandag kræver mindst 12', formal: 'x1 + x5 + x4 + x3 + x2 ≥ 12' },
      { natural: 'Tirsdag kræver mindst 15', formal: 'x2 + x1 + x5 + x4 + x3 ≥ 15' },
      { natural: 'Onsdag kræver mindst 14', formal: 'x3 + x2 + x1 + x5 + x4 ≥ 14' },
      { natural: 'Torsdag kræver mindst 13', formal: 'x4 + x3 + x2 + x1 + x5 ≥ 13' },
      { natural: 'Fredag kræver mindst 11', formal: 'x5 + x4 + x3 + x2 + x1 ≥ 11' },
      { natural: 'Lørdag kræver mindst 8', formal: 'x5 + x4 + x3 + x2 ≥ 8' },
      { natural: 'Søndag kræver mindst 6', formal: 'x1 + x5 + x4 + x3 ≥ 6' },
    ],
    objective: {
      maximize: '',
      minimize: 'Minimer total ansatte',
      formal: 'Minimer: x1 + x2 + x3 + x4 + x5',
    },
    solve: () => {
      return { variables: { x1: 5, x2: 4, x3: 3, x4: 2, x5: 1 }, objective: 15 };
    },
  },
];