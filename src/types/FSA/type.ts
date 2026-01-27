// this is kind of the compromise for the zod restricts IModularResponseSchema and the backend python schema cannot match that
// see file externals/modules/shared/schemas/question-form.schema.ts for details
// since that is a external module, we should not edit that file

import { z } from 'zod';

export const fsaAnswerSchema = z.object({
  states: z.array(z.string()),
  alphabet: z.array(z.string()),
  // Flattened: Array of "from|symbol|to" strings
  transitions: z.array(z.string()), 
  initial_state: z.string(),
  accept_states: z.array(z.string()),
});

export type FSA = z.infer<typeof fsaAnswerSchema>;

export const defaultFSA: FSA = {
  states: [],
  alphabet: [],
  transitions: [],
  initial_state: '',
  accept_states: []
};

export const fsaConfigSchema = z.object({
  evaluation_mode: z.enum(['strict', 'lenient', 'partial']).optional(),
  expected_type: z.enum(['DFA', 'NFA', 'any']).optional(),
  feedback_verbosity: z.enum(['minimal', 'standard', 'detailed']).optional(),

  check_minimality: z.boolean().optional(),
  check_completeness: z.boolean().optional(),

  highlight_errors: z.boolean().optional(),
  show_counterexample: z.boolean().optional(),

  max_test_length: z.number().int().positive().optional(),

  is_dev: z.boolean().optional(),

  epsilon_symbol: z.string(),
})

export type FSAConfig = z.infer<typeof fsaConfigSchema>

export const DEFAULT_FSA_CONFIG: FSAConfig =  {
  evaluation_mode: "lenient",
  expected_type: "any",
  feedback_verbosity: "standard",

  check_minimality: false,
  check_completeness: false,

  highlight_errors: true,
  show_counterexample: true,

  max_test_length: 10,

  is_dev: false,
  epsilon_symbol: "epsilon"
}
