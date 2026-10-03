/* Menu catalogue. Values stay separate from cart and pricing behaviour. */
window.MENU = [
 {id:"esp",name:"Espresso",priceCents:275,category:"drink",inStock:true,note:"Bold, smooth, and straight to the point.",tag:"THE CLASSIC",image:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=700&q=85"},
 {id:"lat",name:"Latte",priceCents:445,category:"drink",inStock:true,note:"Velvety steamed milk, a double espresso, and a little calm.",tag:"CAMPUS FAVORITE",image:"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=700&q=85"},
 {id:"cap",name:"Cappuccino",priceCents:425,category:"drink",inStock:true,note:"A cozy cloud of foam over rich espresso.",tag:"MADE TO SLOW DOWN",image:"https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=700&q=85"},
 {id:"cld",name:"Cold Brew",priceCents:395,category:"drink",inStock:true,note:"Slow-steeped overnight. Ready for your early start.",tag:"CHILLED & READY",image:"https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=700&q=85"},
 {id:"tea",name:"Green Tea",priceCents:315,category:"drink",inStock:false,note:"Light, fresh, and lovely with a quiet study break.",tag:"A GENTLE PAUSE",image:"https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=700&q=85"},
 {id:"moc",name:"Mocha",priceCents:475,category:"drink",inStock:true,note:"Espresso meets chocolate. Your afternoon, sorted.",tag:"A LITTLE TREAT",image:"https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=700&q=85"},
 {id:"crs",name:"Butter Croissant",priceCents:350,category:"food",inStock:true,note:"Golden, flaky layers. Best enjoyed still a little warm.",tag:"BAKED FRESH",image:"https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=85"},
 {id:"bgl",name:"Everything Bagel",priceCents:325,category:"food",inStock:true,note:"Toasty, savory, and always a good idea.",tag:"STUDY FUEL",image:"https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=700&q=85"},
 {id:"mfn",name:"Blueberry Muffin",priceCents:340,category:"food",inStock:false,note:"Soft, buttery, with a little burst of blueberry.",tag:"BAKERY FAVORITE",image:"https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=700&q=85"}
];
window.formatMoney = function(cents){var sign=cents<0?"-":"";return sign+"$"+(Math.abs(cents)/100).toFixed(2);};
window.findMenuItem = function(id){for(var i=0;i<window.MENU.length;i++){if(window.MENU[i].id===id)return window.MENU[i];}};
