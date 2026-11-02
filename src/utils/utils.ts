import type { FieldValues, FormState, Path } from 'react-hook-form';
import type { FieldValidator, Validator } from './types.js';

export function cn(...args: Array<string | undefined>): string {
  return args.filter(Boolean).join(' ').trim();
}

export async function parseValidation(
  value: string | number | undefined,
  validation?: string | FieldValidator,
  validator?: Validator,
) {
  const fn = getValidation(validation, validator);

  if (typeof fn === 'undefined') {
    return true;
  }

  try {
    // RHF reads undefined for a control that was disabled when it registered, validate it as empty
    return await fn(value ?? '');
  } catch (error) {
    console.warn('Validation failed:', error);
    return false;
  }
}

function getValidation(
  validation?: string | FieldValidator,
  validator?: Validator,
): FieldValidator | undefined {
  if (typeof validation === 'function') {
    return validation;
  }
  if (typeof validation === 'string') {
    if (
      typeof validator !== 'object' ||
      validator === null ||
      typeof validator[validation] === 'undefined'
    ) {
      console.warn(
        `Validation '${validation}' does not exists in form validator object`,
      );
      return;
    }

    return validator[validation];
  }
}

export function getFieldClassname<T extends FieldValues>(
  name: Path<T>,
  options: {
    formState: FormState<T>;
    isValidating: boolean;
    validateOnSubmit: boolean;
    className?: string;
  },
) {
  const classNameAux = options.className || 'form-control';

  if (options.validateOnSubmit) {
    if (!options.formState.isSubmitting) {
      return cn(
        classNameAux,
        options.formState.errors[name] && `${classNameAux}-error`,
      );
    }
    return cn(
      classNameAux,
      options.formState.errors[name] && `${classNameAux}-error`,
      options.isValidating ? `${classNameAux}-validating` : '',
    );
  }
  return cn(
    classNameAux,
    options.formState.errors[name] && `${classNameAux}-error`,
    options.isValidating ? `${classNameAux}-validating` : '',
    options.formState.isValid ? `${classNameAux}-valid` : '',
  );
}
