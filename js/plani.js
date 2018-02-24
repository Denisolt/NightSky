/*
======================================================================
plani.js

Ernie Wright  2 June 2013, 26 May 2014
====================================================================== */

var now = {};
var clipped = false;
var ck_starlabels = false;
var ck_conlabels = false;
var ck_dsos = true;
var ck_conlines = true;


function draw_star( context, s )
{
   context.fillStyle = s.color;
   context.beginPath();
   context.arc( s.pos.x, s.pos.y, s.radius* 1.3, 0, 2 * Math.PI );
   context.closePath();
   context.fill();
}


function draw_planet( context, p )
{
   draw_star( context, p );
   context.fillStyle = p.color;
   context.font = "12px Sans-Serif";
   var name = p.name == "Earth" ? "Sun" : p.name;
   context.fillText( name, p.pos.x + 5, p.pos.y );
}


function draw_star_label( context, p )
{
   context.fillStyle = "#888";
   context.strokeStyle = "#888";
   context.font = "11px Sans-Serif";
   context.fillText( p.label, p.pos.x + 5, p.pos.y );
}

   
function draw_con_label( context, p )
{
   context.fillStyle = "#789";
   context.strokeStyle = "#789";
   context.font = "10px Sans-Serif";
   var s = p.name.toUpperCase();
   var w = context.measureText( s ).width;
   context.fillText( s, p.pos.x - w / 2, p.pos.y );
}

   
function ellipse( context, cx, cy, rx, ry, filled )
{
   context.save();
   context.beginPath();
   context.translate( cx - rx, cy - ry );
   context.scale( rx, ry );
   context.arc( 1, 1, 1, 0, 2 * Math.PI, false );
   context.closePath();
   context.restore();
   if ( filled )
      context.fill();
   else
      context.stroke();
}


function draw_dso( context, m )
{
   context.fillStyle = m.color;
   context.strokeStyle = m.color;
   context.font = "10px Sans-Serif";
   context.fillText( m.name, m.pos.x + m.offsetx, m.pos.y + m.offsety );
   if ( m.catalog == 1 && m.id == 45 ) return;
   switch ( m.type ) {
      case 1:
      case 2:
         context.beginPath();
         context.arc( m.pos.x, m.pos.y, 2.5, 0, 2 * Math.PI );
         context.closePath();
         context.stroke();
         break;
      case 3:
      case 4:
      case 5:  context.strokeRect( m.pos.x - 2, m.pos.y - 2, 4, 4 );  break;
      case 6:  ellipse( context, m.pos.x, m.pos.y, 4, 2, true );  break;
      default:
         context.beginPath();
         context.moveTo( m.pos.x - 2, m.pos.y );
         context.lineTo( m.pos.x + 2, m.pos.y );
         context.moveTo( m.pos.x, m.pos.y - 2 );
         context.lineTo( m.pos.x, m.pos.y + 2 );
         context.stroke();
         break;
   }
}


function draw_moon( context )
{
   context.globalCompositeOperation = "source-over";
   var i = Math.floor(( Astro.raddeg( moon.phase ) + 180 ) / 12 );
   context.drawImage( immoons, i * 16, 0, 16, 16, moon.pos.x - 8, moon.pos.y - 8, 16, 16 );
   context.globalCompositeOperation = "lighter";
   context.fillStyle = "#FFF0E0";
   context.font = "12px Sans-Serif";
   context.fillText( "Moon", moon.pos.x + 8, moon.pos.y );
}


function draw_line( context, s1, s2 )
{
   if ( s1.pos.visible && s2.pos.visible ) {
      context.beginPath();
      context.moveTo( s1.pos.x, s1.pos.y );
      context.lineWidth = 0.4;
      context.lineTo( s2.pos.x, s2.pos.y );
      context.stroke();
   }
}


function draw_sky( context, w, h )
{
   /* ----- calculate Earth (sun) position */
   find_planet( planet[ 2 ], null, now.jd );
   var azalt = skypos_transform( planet[ 2 ].pos, now, w, h );
   var bgcolor;
   if ( azalt[ 1 ] > 0 ) bgcolor = "#191d29";              // 24, 36, 72
   else if ( azalt[ 1 ] > -0.10472 ) bgcolor = "#191d29";  // 18, 27, 54
   else if ( azalt[ 1 ] > -0.20944 ) bgcolor = "#191d29";  // 12, 18, 36
   else if ( azalt[ 1 ] > -0.31416 ) bgcolor = "#191d29";  //  6,  9, 18
   else bgcolor = "#191d29";

   /* ---- background, blue if sun up, black otherwise */
   context.clearRect( 0, 0, w, h );
   context.globalCompositeOperation = "source-over";
   context.fillStyle = bgcolor;  // planet[ 2 ].pos.visible ? "#182448" : "#000000";
   context.beginPath();
   context.arc( w / 2, h / 2, w / 2, 0, 2 * Math.PI );

   context.closePath();
   context.fill();
   if ( !clipped ) {
      context.clip();
      clipped = true;
   }

   context.globalCompositeOperation = "xor";
   context.lineWidth = 1;

   /* ----- horizon labels */
   context.textBaseline = "middle";
   context.fillStyle = "#888";
   context.font = "12px Sans-Serif";

   /* ---- stars */
   var len = star.length;
   for ( var i = 0; i < len; i++ ) {
      skypos_transform( star[ i ].pos, now, w, h );
      if ( star[ i ].pos.visible )
         draw_star( context, star[ i ] );
   }

   /* ---- star labels */
   if ( ck_starlabels ) {
      var len = starname.length;
      for ( i = 0; i < len; i++ ) {
         skypos_transform( starname[ i ].pos, now, w, h );
         if ( starname[ i ].pos.visible )
            draw_star_label( context, starname[ i ] );
      }
   }

   /* ---- constellation labels */
   if ( ck_conlabels ) {
      var len = conname.length;
      for ( i = 0; i < len; i++ ) {
         skypos_transform( conname[ i ].pos, now, w, h );
         if ( conname[ i ].pos.visible )
            draw_con_label( context, conname[ i ] );
      }
   }
   
   /* ---- constellation lines */
   if ( ck_conlines ) {
      context.strokeStyle = "#303030";
      len = conline.length;
      for ( i = 0; i < len; i++ )
         draw_line( context, star[ conline[ i ][ 0 ]], star[ conline[ i ][ 1 ]] );
   }

   /* ---- planets */
   for ( i = 0; i < 9; i++ ) {
      if ( i != 2 ) {
         find_planet( planet[ i ], planet[ 2 ], now.jd );
         skypos_transform( planet[ i ].pos, now, w, h );
      }
      if ( planet[ i ].pos.visible )
         draw_planet( context, );
   }
   
   /* ---- DSOs */
   if ( ck_dsos ) {
      len = dso.length;
      for ( i = 0; i < len; i++ ) {
         skypos_transform( dso[ i ].pos, now, w, h );
         if ( dso[ i ].pos.visible )
            draw_dso( context, dso[ i ] );
      }
   }

   /* ----- Moon */
   find_moon( moon, planet[ 2 ], now.jd );
   console.log( "phase: " + Astro.raddeg( moon.phase ));
   skypos_transform( moon.pos, now, w, h );
   if ( moon.pos.visible )
      draw_moon( context );
}


function refresh()
{
   var canvas = document.getElementById( "planicanvas" );
   if ( !canvas || !canvas.getContext ) return;
   var context = canvas.getContext( "2d" );
   draw_sky( context, canvas.width, canvas.height );
}

function saveImage()
{
   var link = document.createElement('a');
   var canvas = document.getElementById("planicanvas");

   link.href = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
   link.download = 'image.png';
   link.click();
   window.URL.revokeObjectURL(url);
}

function set_user_obs()
{
   var dt = document.getElementById( "user_date" );
   var lon = document.getElementById( "user_lon" );
   var lat = document.getElementById( "user_lat" );
   var slab = document.getElementById( "user_starlab" );
   var clab = document.getElementById( "user_conlab" );
   var idso = document.getElementById( "user_dsos" );
   var clin = document.getElementById( "user_conline" );

   d = now.getDate();
   dt.value = d.toString().slice( 0, 33 );
   lon.value = now.getLonDegrees();
   lat.value = now.getLatDegrees();
   slab.checked = ck_starlabels;
   clab.checked = ck_conlabels;
   idso.checked = ck_dsos;
   clin.checked = ck_conlines;
}


function get_user_obs()
{
   var dt = document.getElementById( "user_date" );
   var lon = document.getElementById( "user_lon" );
   var lat = document.getElementById( "user_lat" );
   var slab = document.getElementById( "user_starlab" );
   var clab = document.getElementById( "user_conlab" );
   var idso = document.getElementById( "user_dsos" );
   var clin = document.getElementById( "user_conline" );

   var n = Date.parse( dt.value );
   if ( isNaN( n )) {
      alert( "Your browser doesn't think\n'" + dt.value + "'\nis a valid date." );
      set_user_obs();
      return;
   }
   var d = new Date( n );
   now.setDate( d );

   if ( lon.value >= -180 && lon.value < 360 )
      now.setLonDegrees( lon.value );
      
   if ( lat.value >= -90 && lat.value <= 90 )
      now.setLatDegrees( lat.value );

   ck_starlabels = slab.checked;
   ck_conlabels = clab.checked;
   ck_dsos = idso.checked;
   ck_conlines = clin.checked;
   console.log( "slab " + ck_starlabels + " dsos " + ck_dsos );
   set_user_obs();
   refresh();
}


function inc_button()
{
   var inc = document.getElementById( "increment" );
   now.incHour( inc.value );
   set_user_obs();
   refresh();
}


function dec_button()
{
   var inc = document.getElementById( "increment" );
   now.incHour( -inc.value );
   set_user_obs();
   refresh();
}


function now_button()
{
   now.setDate( new Date() );
   set_user_obs();
   refresh();
}


function canvasApp()
{
   init_stars( star );
   init_dsos( dso );
   init_planets( planet );
   now = new Observer();
   set_user_obs();
   refresh();
}


function setGeoPos( geopos ) {
   now.setLatDegrees( geopos.coords.latitude );
   now.setLonDegrees( geopos.coords.longitude );
   set_user_obs();
   refresh();
}


function errGeoPos( error ) {
   alert( 'Geolocation error ' + error.code + ': ' + error.message );
};


function getGeoPos()
{
   if ( navigator.geolocation )
      navigator.geolocation.getCurrentPosition( setGeoPos, errGeoPos );
}