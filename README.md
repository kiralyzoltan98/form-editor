# JsonForms Editor

## Scope

The scope of this project is to provide a jsonforms visual editor.

## Main functionality and features

- Component palette
- Edit Form tab
- Preview tab
- View Code tab
- Inspector

### Component palette
This is a panel on the left of the screen, it holds the components the user can use to put together any kind of form.
It consists of two sections at the moment:
- Layouts
- Form Fields

#### Layouts
Layouts are components that can hold other components. There are:
- Vertical
- Horizontal
layouts.
Vertical layout aligns its items vertically, Horizontal layout aligns its items horizontally.

#### Form Fields
Form fields are the input elements of a form. Currently supported form fields:
- Text input
- Number input
- Checkbox

##### Data a Form Field holds
Form fields each have a **Title**, this is used as a label for the input when rendered. They also have a **Type**, witch tells us what kind of data is stored in the input, and a **Category** as well, that can be either '**field**' or '**lyout**'

### Edit Form
Each element in the component palette can be dragged into the Edit Form tab, and placed into a **dropzone**. Placed elements can be moved by also grabing them, and releaseing them on another dropzone. 


