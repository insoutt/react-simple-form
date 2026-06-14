
# react-simple-form

react-simple-form is a component to build Forms in react in a simple way.


## Installation

Install react-simple-form with:

```bash
  npm install @insoutt/react-simple-form
  yarn add @insoutt/react-simple-form
```


## Usage/Examples

```typescript
import { FieldProps, Form } from "@insoutt/react-simple-form";
import {useState} from "react";


interface IForm {
    email: string
    password: string
}

function required(value: string | number) {
    return value.toString().length > 0 || 'Required field'
}

const formSchema: FieldProps<IForm>[] = [
    {
        name: 'email',
        type: 'email',
        label: 'E-mail',
        validation: required,
    },
    {
        name: 'password',
        type: 'password',
        label: 'Password',
        validation: required,
    },
];

function App() {
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = ({email, password}: IForm) => {
        // Submit logic
    }
    return (
        <Form<IForm>
            classNames={{
                submitButton: 'btn btn-secondary',
            }}
            hideClearButton
            isLoading={isLoading}
            onSubmit={onSubmit}
            fields={formSchema}
        />
    )
}
```

### License
This project is licensed under the [MIT license](https://github.com/insoutt/react-simple-form/blob/master/LICENSE).
