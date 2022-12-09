import {Type} from 'xelf/typ'
import {Model} from '../dom'

export interface Extra {
	widg?:any
	label?:string
	clss?:string
	extra?:{[key:string]:any}
}

export type MetaElem = LayoutMeta | FormMeta | FieldMeta

export interface FormCommon extends Extra {
	typ:Type
	ro:boolean
	model?:Model
}
export interface FormMeta extends FormCommon {
	elems:MetaElem[]
	fields:FieldMeta[]
}

export interface FieldMeta extends Extra {
	key:string
	typ:Type
	nil:boolean
	ro:boolean
}

export interface LayoutMeta extends Extra {
	layout:string
	elems:MetaElem[]
}

export type ArgsElem = FormArgs | FieldArgs | LayoutArgs |  ArgsElem[]
export type FieldArgs = Partial<FieldMeta>
export interface FormArgs extends Partial<FormCommon> {
	elems?:ArgsElem[]
}
export interface LayoutArgs extends Extra {
	layout:string
	elems?:ArgsElem[]
}

function metaFields(elems:MetaElem[], res:FieldMeta[] = []):FieldMeta[] {
	elems.forEach(e => {
		if ('layout' in e) metaFields(e.elems, res)
		else if ('key' in e) res.push(e)
		// else form
	})
	return res
}
function metaForms(elems:MetaElem[], res:FormMeta[] = []):FormMeta[] {
	elems.forEach(e => {
		if ('layout' in e) metaForms(e.elems, res)
		else if ('elems' in e) res.push(e)
		// else field
	})
	return res
}
