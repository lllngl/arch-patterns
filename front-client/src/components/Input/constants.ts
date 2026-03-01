export const INPUT_DEFAULT_CLASSES = {
  base: 'px-3 py-2 border rounded',
  focus: 'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
  error: 'border-red-500',
  success: 'border-green-500',
};

export const INPUT_TYPES = [
  'text',
  'email',
  'password',
  'number',
  'tel',
  'url',
  'search',
] as const;

export type InputType = typeof INPUT_TYPES[number];