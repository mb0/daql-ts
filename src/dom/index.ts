import {parseKindName} from 'xelf/knd'
import {scan} from 'xelf/ast'
import {Type, parseType} from 'xelf/typ'

export const Bit = {
	Opt: 1,
	PK: 2,
	Idx: 4,
	Uniq: 8,
	Asc: 16,
	Desc: 32,
	Auto: 64,
	RO: 128,
}

export interface Node {
	name:string
	vers:string
	extra?:{[key:string]:any}
}
export interface Project extends Node {
	schemas:Schema[]
}
export interface Schema extends Node {
	path?:string
	use?:string[]
	models:Model[]
}
export interface Index {
	name?:string
	keys:string[]
	unique?:boolean
}
export interface Obj {
	indices?:Index[]
	orderby?:string[]
}
export interface Model extends Node {
	schema:string
	qname:string
	key:string
	kind:number
	elems:Elem[]
	object?:Obj
}
export interface Elem {
	name:string
	key:string
	type:Type
	val?:number
	bits?:number
	ref?:string
	extra?:{[key:string]:any}
}

export function modelType(m:Model):Type {
	const params = m.elems.map(el => {
		return {name:el.key.toLowerCase(), typ:el.type}
	})
	return {kind:m.kind, id:0, body:{name:m.qname, params}}
}
export interface ElemOpt {
	name?:string
	type:string
	val?:number
	bits?:number
	ref?:string
	extra?:{[key:string]:any}
}
export function makeElem(opt:ElemOpt):Elem {
	const {val, bits, ref, extra} = opt
	const name = opt.name || ""
	const key = name.toLowerCase()
	const type = parseType(scan(opt.type))
	return {name, key, type, val, bits, ref, extra}
}

export interface ModelOpt {
	name:string
	kind?:string
	schema?:string
	elems:ElemOpt[]
	object?:Obj
	extra?:{[key:string]:any}
}
export function makeModel(opt:ModelOpt):Model {
	const {name, object, extra} = opt
	const key = name.toLowerCase()
	const schema = opt.schema||''
	const qname = schema+'.'+name
	const kind = parseKindName(opt.kind||'obj')
	return {name, vers:"", schema, key, qname, kind, elems:opt.elems.map(makeElem), object, extra}
}
export interface SchemaOpt {
	name:string
	models:ModelOpt[]
	extra?:{[key:string]:any}
}
export function makeSchema(opt:SchemaOpt):Schema {
	const {name, extra} = opt
	return {name, vers:"", models:opt.models.map(m => {
		m.schema = name
		return makeModel(m)
	}), extra}
}
export interface ProjectOpt {
	name:string
	schemas:SchemaOpt[]
	vers?:string
	extra?:{[key:string]:any}
}
export function makeProject(opt:ProjectOpt):Project {
	const {name, vers, extra} = opt
	return {name, vers:vers||'', schemas:opt.schemas.map(makeSchema), extra}
}

