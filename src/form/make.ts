import {Type, knd, typ} from 'xelf/typ'
import {modelType} from '../dom'
import {MetaElem, FormMeta, FieldMeta, ArgsElem, FormArgs, FieldArgs} from './meta'
import {Form, FormLoader} from './form'

export function makeForm(loader:FormLoader, args:FormArgs):Form {
	return new Form(loader, formMeta(args))
}

function formMeta(a:FormArgs):FormMeta {
	if (Array.isArray(a)) a = {elems:a}
	const res:FormMeta = {typ:typ.void,
		model: a.model,
		elems:[], fields:[],
		ro:a.ro||false,
	}
	if (a.model) {
		const mt = modelType(a.model)
		if (!a.typ) a.typ = mt
		else if ((a.typ.kind&knd.data) == knd.list && a.typ.body == null) {
			a.typ = {...a.typ, body:mt}
		}
	}
	if (a.typ) {
		res.typ = a.typ
		let b = paramBody(a.typ)
		let fmap:{[key:string]:FieldArgs} = {}
		if (b && b.params) b.params.forEach(p => {
			if (p.name && p.name != "id" && p.name != "rev") {
				fmap[p.name] = {key:p.name, typ:p.typ}
			} // else handle embed ?
		})
		if (!a.elems || !a.elems.length) a.elems = Object.keys(fmap).map(key => fmap[key])
		res.elems = transform(res, a.elems)
	} else if ('elems' in a && a.elems && a.elems.length){
		res.elems = transform(res, a.elems)
		res.typ = typ.obj(...res.fields.map(f => {
			return {name: f.key, typ:f.typ}
		}))
	}
	if (!res.fields.length) throw new Error("form needs fields")
	return res
}

function fieldMeta(f:FormMeta, a:FieldArgs):FieldMeta {
	if (!a.key) {
		// TODO handle embed?
		throw new Error("no field key")
	}
	if (!a.typ) {
		throw new Error("no field typ")
	}
	return {key:a.key, typ:a.typ, widg:a.widg,
		ro:a.ro||false,
		nil:a.nil||false,
	}
}

function transform(par:FormMeta, elems:ArgsElem[]):MetaElem[] {
	return elems.map((e:ArgsElem):MetaElem => {
		if (Array.isArray(e)) {
			return {layout:'list', elems:transform(par, e)}
		} else if ('layout' in e) {
			return {layout:e.layout, elems:e.elems ? transform(par, e.elems) : []}
		} else if ('key' in e) {
			const field = fieldMeta(par, e)
			par.fields.push(field)
			return field
		}
		throw new Error("unexpected form element "+JSON.stringify(e))
	})
}
function paramBody(t:Type) {
	return t.body && 'params' in t.body ? t.body : null
}
