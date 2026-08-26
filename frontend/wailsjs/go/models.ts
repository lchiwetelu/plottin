export namespace main {
	
	export class Chapter {
	    id: string;
	    projectId: string;
	    number: number;
	    title: string;
	    wordCount: number;
	    content: any;
	
	    static createFrom(source: any = {}) {
	        return new Chapter(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.projectId = source["projectId"];
	        this.number = source["number"];
	        this.title = source["title"];
	        this.wordCount = source["wordCount"];
	        this.content = source["content"];
	    }
	}
	export class Character {
	    id: string;
	    name: string;
	    role: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new Character(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.role = source["role"];
	        this.description = source["description"];
	    }
	}
	export class ExportOptions {
	    format: string;
	    fontFamily: string;
	    fontSize: number;
	    includeImages: boolean;
	    includeChapterTitles: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ExportOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.format = source["format"];
	        this.fontFamily = source["fontFamily"];
	        this.fontSize = source["fontSize"];
	        this.includeImages = source["includeImages"];
	        this.includeChapterTitles = source["includeChapterTitles"];
	    }
	}
	export class ExportResult {
	    path: string;
	    success: boolean;
	    message: string;
	    canceled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ExportResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.success = source["success"];
	        this.message = source["message"];
	        this.canceled = source["canceled"];
	    }
	}
	export class Moodboard {
	    id: string;
	    projectId: string;
	    title: string;
	    nodes: any;
	    edges: any;
	
	    static createFrom(source: any = {}) {
	        return new Moodboard(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.projectId = source["projectId"];
	        this.title = source["title"];
	        this.nodes = source["nodes"];
	        this.edges = source["edges"];
	    }
	}
	export class Note {
	    id: string;
	    title: string;
	    body: string;
	    kind: string;
	    audioUrl: string;
	
	    static createFrom(source: any = {}) {
	        return new Note(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.body = source["body"];
	        this.kind = source["kind"];
	        this.audioUrl = source["audioUrl"];
	    }
	}
	export class Project {
	    id: string;
	    title: string;
	    genre: string;
	    wordCount: number;
	    chapterCount: number;
	    progressPct: number;
	    targetWordCount: number;
	    // Go type: time
	    editedAt: any;
	    cover: string;
	    font: string;
	    fontSize: number;
	
	    static createFrom(source: any = {}) {
	        return new Project(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.genre = source["genre"];
	        this.wordCount = source["wordCount"];
	        this.chapterCount = source["chapterCount"];
	        this.progressPct = source["progressPct"];
	        this.targetWordCount = source["targetWordCount"];
	        this.editedAt = this.convertValues(source["editedAt"], null);
	        this.cover = source["cover"];
	        this.font = source["font"];
	        this.fontSize = source["fontSize"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ResearchLink {
	    id: string;
	    title: string;
	    url: string;
	    projectId?: string;
	
	    static createFrom(source: any = {}) {
	        return new ResearchLink(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.url = source["url"];
	        this.projectId = source["projectId"];
	    }
	}
	export class ProjectDetail {
	    project: Project;
	    chapters: Chapter[];
	    characters: Character[];
	    research: ResearchLink[];
	    notes: Note[];
	
	    static createFrom(source: any = {}) {
	        return new ProjectDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.project = this.convertValues(source["project"], Project);
	        this.chapters = this.convertValues(source["chapters"], Chapter);
	        this.characters = this.convertValues(source["characters"], Character);
	        this.research = this.convertValues(source["research"], ResearchLink);
	        this.notes = this.convertValues(source["notes"], Note);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class WriterDesk {
	    streakDays: number;
	    streakMessage: string;
	    wordsToday: number;
	    dailyGoal: number;
	    quickResearch: ResearchLink[];
	
	    static createFrom(source: any = {}) {
	        return new WriterDesk(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.streakDays = source["streakDays"];
	        this.streakMessage = source["streakMessage"];
	        this.wordsToday = source["wordsToday"];
	        this.dailyGoal = source["dailyGoal"];
	        this.quickResearch = this.convertValues(source["quickResearch"], ResearchLink);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

