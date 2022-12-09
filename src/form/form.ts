import {typedAs, equal} from 'xelf/lit'
import {LayoutMeta, FormMeta, FieldMeta} from './meta'


let maxID = 0

export interface FormLoader {}
export class FormError extends Error {
	constructor(public target:FormParent, msg:string) {
		super(msg)
	}
}

export type FormElem = Layout|Form|Field

export class Layout {
	data?:object
	constructor(
		readonly meta:LayoutMeta,
		readonly elems:FormElem[],
	) {}
}

export class Field {
	raw:any
	val:any
	changed:boolean = false
	err?:FormError
	inline?:Form
	constructor(
		readonly form:Form,
		readonly meta:FieldMeta,
		readonly id:string = ""
	) {
		this.id = id || form.id+'.'+meta.key
	}
	async init(raw:any):Promise<Field> {
		if (this.inline) {
			await this.inline.init(raw)
		} else {
			this.raw = raw
			this.val = typedAs(raw, this.meta.typ)
		}
		return this
	}
	label():string {
		return this.meta.label || this.meta.key
	}
	disabled():boolean {
		return this.meta.ro && !this.form.isNew()
	}
	edit(val:any, silent=false) {
		this.err = undefined
		this.val = val
		this.form.edit(this, val, silent)
		return val
	}
	check():FormError|null {
		return null
	}
}

type FormParent = Field|Form|null
export class Form {
	org:any
	elems:FormElem[] = []
	fields:{[key:string]:Field} = {}
	changed:{[key:string]:any} = {}
	errs:FormError[] = []
	constructor(
		readonly loader:FormLoader,
		readonly meta:FormMeta,
		readonly parent:FormParent=null,
		readonly id:string="",
	) {
		this.id = id || "form" + (++maxID)
	}
	async init(val:any):Promise<Form> {
		val = val || {}
		this.org = val
		this.errs = []
		this.changed = {}
		this.fields = {}
		await Promise.all(this.meta.fields.map(f => {
			let field = this.fields[f.key] = new Field(this, f)
			return field.init(val[f.key])
		}))
		return this
	}
	check():FormError|null {
		return null
	}
	valid():boolean {
		return !this.errs.length
	}
	addError(msg:string) {
		this.errs.push(new FormError(this, msg))
	}
	value():any {
		const val = this.org ? {...this.org} : {}
		Object.keys(this.fields).forEach(key => {
			val[key] = this.fields[key].val
		})
		return val
	}
	isNew():boolean {
		return this.org === undefined
	}
	edit(f:Field, val:any, silent=false) {
		const key = f.meta.key
		console.log("edit form "+f.id, val)
		const org = this.org ? this.org[key] : null
		this.changed[key] = !equal(org, val)
		this.check()
		// TODO call parent form 
	}
}
