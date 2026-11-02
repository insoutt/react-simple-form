import { useFormContext, useWatch, get } from 'react-hook-form';
import { cn } from '../utils/utils.js';

interface ClearButtonProps {
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
}

// Owns the value watcher so keystrokes re-render this button only, not the whole form
const ClearButton = ({ className, onClick, children }: ClearButtonProps) => {
  const { control, formState } = useFormContext();
  // Compare registered values only, a field without default counts as clean while empty
  const values = useWatch({ control });
  const isDirty = Object.keys(values).some((name) => {
    const defaultValue = get(formState.defaultValues, name);
    const value = values[name];
    return typeof defaultValue === 'undefined'
      ? !(
          value === undefined ||
          value === null ||
          value === false ||
          value.length === 0
        )
      : value !== defaultValue;
  });

  if (!isDirty) return null;

  return (
    <button type="button" className={cn(className)} onClick={onClick}>
      {children}
    </button>
  );
};

export default ClearButton;
