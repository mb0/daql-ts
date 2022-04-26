
type Callback = (head:string, data?:any, tok?:number)=>void

export class Hub {
	public url = ""
	public ok = false
	public ws:WebSocket|null = null
	public queue:string[] = []
	public log?:Function = console.log
	private lastReq = 0
	private cbs:{[subj:string]:Callback[]} = {}
	constructor() {}
	nextReq()   { return ++this.lastReq }
	connected() { return this.ws && this.ok }
	connect(url:string, init?:()=>void) {
		if (this.ws) {
			if (url != this.url) {
				throw new Error("use a different hub for new connections")
			}
			// connected trigger init
			if (init != undefined) {
				if (this.ok) init()
				else this.one("*open", () => init())
			}
			return this.ws
		}
		this.url = url
		let s = this.ws = new WebSocket(url)
		s.onopen = e => {
			if (this.log) this.log("hub open", url)
			this.ok = true
			if (this.queue.length > 0) {
				if (this.log) this.log("hub send queue", this.queue)
				this.queue.forEach(msg => s.send(msg))
				this.queue = []
			}
			if (init != undefined) init()
			this.trigger("*open", e)
		}
		s.onerror = e => {
			this.trigger("*error", e)
			s.close()
		}
		s.onclose = e => {
			if (this.log) this.log("hub close", {code:e.code, wasClean:e.wasClean, reason:e.reason})
			this.ok = false
			this.trigger("*close", e)
			this.ws = null
		}
		s.onmessage = e => {
			try {
				let head = e.data, req = 0, data = null
				let i = e.data.indexOf('\n')
				if (i > 0) {
					head = e.data.slice(0, i)
					let j = e.data.indexOf('#')
					if (j > 0) {
						req = parseInt(head.slice(j+1), 10)
						head = head.slice(0, j)
					}
					if (e.data.length > i+1) {
						data = JSON.parse(e.data.slice(i+1))
					}
				}
				if (this.log) this.log("hub receive", head, req, data)
				this.trigger(head, data, req)
			} catch (err) {
				if (this.log) this.log("hub error", err)
				this.trigger("err", {msg: "" + err})
			}
		}
		return s

	}
	send(head:string, data?:any, req?:number):void {
		let msg = head
		if (req == null) req = 0
		else if (req != 0) msg += "#" + req
		if (data != null) msg += "\n"+ JSON.stringify(data)
		if (this.ws && this.ok) {
			if (this.log) this.log("hub send", head, req, data)
			this.ws.send(msg)
		} else {
			if (this.log) this.log("hub queue", head, data)
			this.queue.push(msg)
		}
	}
	request(head:string, data?:any):Promise<any> {
		return new Promise<any>((resolve, _) => {
			const req = this.nextReq()
			const handler = (head:string, res?:any, tok?:number) => {
				if (tok != req) return
				resolve(res)
				this.off(head, handler)
			}
			this.on(head, handler)
			this.send(head, data, req)
		})
	}
	on(subj:string, hand:Callback) {
		(this.cbs[subj] || (this.cbs[subj] = [])).push(hand)
	}
	one(subj:string, hand:Callback) {
		const once = (subj:string, data?:any, req?:number) => {
			this.off(subj, once)
			hand(subj, data, req)
		}
		this.on(subj, once)
	}
	off(subj:string, hand:Callback) {
		const cb = this.cbs[subj]
		if (cb) {
			let idx = cb.indexOf(hand)
			if (idx >= 0) cb.splice(idx-1, 1)
		}
	}
	trigger(subj:string, data?:any, req?:number) {
		const cb = this.cbs[subj]
		if (cb) cb.forEach(hand => hand(subj, data, req))
	}
	close() {
		if (this.ws && this.ok) {
			this.ws.close()
			this.ok = false
		}
	}
}

export const hub = new Hub()

export default hub

export function hubUrl(path:string):string {
	let url = location.protocol + "//" + location.host + path
	if (url.startsWith("http")) {
		url = "ws" + url.slice(4)
	}
	return url
}
export function timeout<T>(prom:Promise<T>, ms:number):Promise<T> {
	let id:any, t = new Promise<T>((_, reject) => {
		id = setTimeout(() => reject(new Error("timeout")), ms)
	})
	return Promise.race([prom, t]).then(val => {
		clearTimeout(id)
		return val
	}, err => {
		clearTimeout(id)
		throw err
	})
}
