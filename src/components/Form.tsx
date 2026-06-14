import { useForm, SubmitHandler, FormProvider, FieldValues } from "react-hook-form"
import FormField from "./FormField";
import { FormProps } from '../utils/types';
import { cn } from '../utils/utils';
import { SimpleFormContext } from "../contexts/simple-form-context";

const Form = <T extends FieldValues>({fields, validator, beforeSubmit, afterSubmit, className, classNames, isLoading, onSubmit, onClear, loadingText, hideClearButton, validateOnSubmit, children, defaultValues, preprocessors, submitText = 'Submit', clearText = 'Clear'}: FormProps<T>) => {
    loadingText = loadingText || submitText;

    const methods = useForm<T>({
        defaultValues,
    });

    const {isSubmitting, isDirty} = methods.formState;
    const isFormBusy = isLoading || isSubmitting;

    const formSubmit: SubmitHandler<T> = async (values: T) => {
        if(typeof beforeSubmit === 'function') {
            try {
                const before = await beforeSubmit(values);
                if(before === false) {
                    return;
                } else if(before !== true) {
                    values = before;
                }
            } catch (error) {
                if(error instanceof Error) {
                    throw new Error('Before submit fails, reason: ' + error?.message)
                }
                throw new Error('beforeSubmit fails')
            }
        }

        if(validateOnSubmit) {
            // Call validation when validateOnSubmit is true
            const isValid = await methods.trigger();

            if (!isValid) {
                return;
            }
        }

        Promise.resolve(onSubmit?.(values))
            .then(() => afterSubmit?.(values));

    };

    const clear = () => {
        methods.reset();
        onClear?.();
    }

    return (
        <SimpleFormContext.Provider value={{
            isLoading: !!isFormBusy,
            validateOnSubmit: !!validateOnSubmit,
            validator,
            classNames,
            preprocessors,
        }}>
            <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(formSubmit)} className={className}>
                {fields.map(field => (
                    <FormField<T> key={field.name} {...field}/>
                ))}

                {typeof children === 'function'
                    ? children(methods.handleSubmit(formSubmit), clear)
                    : typeof children !=='undefined' ? children : <div className="form-action-buttons">
                            <button className={cn(classNames?.submitButton || 'btn btn-primary')} type="submit" disabled={isFormBusy}>
                                {isFormBusy ? loadingText : submitText}
                            </button>
                            {!hideClearButton && !isFormBusy && isDirty && <>
                                <button type="button" className={cn(classNames?.clearButton)} onClick={clear}>
                                    {clearText}
                                </button>
                            </>}
                        </div>}
            </form>
        </FormProvider>
        </SimpleFormContext.Provider>
    )
}

export default Form;