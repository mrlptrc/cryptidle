export type CombatAction={file:string;frames:number;fps:number;loop:boolean;impact?:{x:number;y:number}};
export const combatAssets={
 warrior:{label:'Guerreiro',actions:{idle:{file:'/art/warrior-forest-idle.png',frames:6,fps:6,loop:true},walk:{file:'/art/warrior-forest-walk.png',frames:6,fps:8,loop:true},attack:{file:'/art/warrior-forest-attack.png',frames:6,fps:10,loop:false,impact:{x:.77,y:.45}},skill:{file:'/art/warrior-forest-skill.png',frames:6,fps:10,loop:false,impact:{x:.82,y:.4}},hurt:{file:'/art/warrior-forest-hurt.png',frames:6,fps:8,loop:false},death:{file:'/art/warrior-forest-death.png',frames:6,fps:7,loop:false}},directions:['left','right']},
 bat:{label:'Morcego sombrio',actions:{idle:{file:'/art/bat-forest-idle.png',frames:6,fps:6,loop:true},move:{file:'/art/bat-forest-move.png',frames:6,fps:8,loop:true},attack:{file:'/art/bat-forest-attack.png',frames:6,fps:10,loop:false,impact:{x:.75,y:.5}},hurt:{file:'/art/bat-forest-hurt.png',frames:6,fps:8,loop:false},death:{file:'/art/bat-forest-death.png',frames:6,fps:7,loop:false}},directions:['left','right']}
} as const;
export type CombatActor=keyof typeof combatAssets;
