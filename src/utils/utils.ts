import { FieldValues, FormState, Path } from "react-hook-form";
import { FieldValidator, Validator } from "./types";


export function cn(...args: Array<string | undefined>): string {
    return args.filter(Boolean).join(' ').trim();
}

export async function parseValidation<T extends FieldValues>(value: string | number, formState: FormState<T>, validateOnSubmit: boolean, validation?: string | FieldValidator, validator?: Validator) {
    if(typeof value === 'undefined') return;

    // Valid field when updating, only check validation on submit form
    if(validateOnSubmit && !formState.isSubmitting) return true;

    const fn = getValidation(validation, validator);

    if(typeof fn === 'undefined') {
        return true;
    }

    return Promise.resolve(fn(value));
}

function getValidation(validation?: string | FieldValidator, validator?: Validator): FieldValidator | undefined {
    if(typeof validation === 'function') {
        return validation;
    }
    if(typeof validator !== 'object' || validator === null) {
        return;
    }
    if(typeof validation === 'string') {
        if(typeof validator[validation] === 'undefined') {
            console.warn(`Validation '${validation}' does not exists in form validator object`);
            return;
        }

        return validator[validation];
    }
}

export function getFieldClassname<T extends FieldValues>(name: Path<T>, options: {formState: FormState<T>, isValidating: boolean, validateOnSubmit: boolean, className?: string}) {
    const classNameAux = options.className || 'form-control';

    if(options.validateOnSubmit) {
        if(!options.formState.isSubmitting) {
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