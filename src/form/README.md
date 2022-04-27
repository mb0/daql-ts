form
====

A form library based on xelf typed values.

Four layers
-----------
Four layers of objects are scary I'd say. I have tried numerous times to arrive at a generic design
with less layers, but failed...

 1. Args layer to aid and type check form configuration
    We want to provide users a relaxed model to define forms
 2. Meta layer to have a known and checked form definitions
    We want to use form lists with multiple instance of the same definition
 3. Form layer to actually manage values and editing
    Well thats the meat of a form library
 4. Widget layer to render the user interface
    We might want to use differnt view layer at some point

It is obvious from the reasoning that the last two layers can merged at the cost of the generic
design ambition. Then again - we want some common API to manage values apart from the view
representation, and finally mithril components work better as a separate layer.

Form Elements
-------------

ArgsElem	MetaElem	FormElem	Widget
FormArgs	FormMeta	Form		FormWidget
FieldArgs	FieldMeta	Field		FieldWidget
LayoutArgs	LayoutMeta	Layout		LayoutWidget

We transform a FormArgs argument to a FormMeta definition. We create a Form from that definition
and initialize with a value. We then use widgets to render the user interface.

Hierarchy
---------
We always start with a form. A form contains any number of elements. Commonly a form has just a
list of fields. It can hold a number of forms, each with its fields grouped into nested layouts.

A layout provides a way to easily group, decorate form elements and inject additions into the
resulting user interface.

