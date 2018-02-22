/*
======================================================================
skypos.js

Ernie Wright  2 June 2013
====================================================================== */

function skypos_transform( pos, now, w, h )
{
   var coord = [ pos.ra, pos.dec ];
   Astro.precess( Astro.JD_J2000, now.jd, coord );
   coord[ 0 ] = now.lst - coord[ 0 ];
   Astro.aa_hadec( now.latitude, coord, coord );
   if ( coord[ 1 ] < 0 )
      pos.visible = false;
   else {
      pos.visible = true;
      var tmp = 0.5 - coord[ 1 ] / Math.PI;
      pos.x = w * ( 0.5 - tmp * Math.sin( coord[ 0 ] ));
      pos.y = h * ( 0.5 - tmp * Math.cos( coord[ 0 ] ));
   }
   return coord;
}


function init_stars( star )
{
   var clut = [
      "#AEC1FF",  /* bv = -0.4 */
      "#C5D3FF",
      "#EAEDFF",
      "#FFF6F3",
      "#FFEAD3",
      "#FFE1B4",
      "#FFD7A6",
      "#FFC682",
      "#FF4500"   /* bv =  2.0 */
   ];

   var len = star.length;
   for ( var i = 0; i < len; i++ ) {
      if ( star[ i ].mag < 3.5 ) {
         var cindex = Math.round( 8 * ( star[ i ].bv + 0.4 ) / 2.4 );
         cindex = Math.max( 0, Math.min( 8, cindex ));
         star[ i ].color = clut[ cindex ];
         star[ i ].radius = 3.1 - 0.6 * star[ i ].mag;   // 1.0 to 4.0
         star[ i ].bright = true;
      }
      else {
         var gray = 160 - Math.round(( star[ i ].mag - 3.5 ) * 80.0 );
         star[ i ].color = "#" + ( 1 << 24 | gray << 16 | gray << 8 | gray ).toString( 16 ).slice( 1 );
         star[ i ].radius = 1;
         star[ i ].bright = false;
      }
   }
}


function init_dsos( dso )
{
   var clut = [
      "#A0A040",   /* 1 open cluster      */
      "#A0A040",   /* 2 globular cluster  */
      "#40A060",   /* 3 nebula            */
      "#40A060",   /* 4 planetary nebula  */
      "#40A060",   /* 5 supernova remnant */
      "#A04040",   /* 6 galaxy            */
      "#808080"    /* 7 other             */
   ];

   var len = dso.length;
   for ( i = 0; i < len; i++ ) {
      dso[ i ].color = clut[ dso[ i ].type - 1 ];
      dso[ i ].offsetx = 4;
      dso[ i ].offsety = -3;

      switch ( dso[ i ].catalog ) {
         case 1:  dso[ i ].name = "M" + dso[ i ].id.toString(); break;
         case 2:  dso[ i ].name = dso[ i ].id.toString(); break;
         case 0:  dso[ i ].name = dso[ i ].id == 2 ? "SMC" : "LMC"; break;
         default: dso[ i ].name = " ";
      }

      /* special cases */

      switch ( dso[ i ].catalog ) {
         case 1:
            switch ( dso[ i ].id ) {
               case 8:  dso[ i ].offsetx =   4; dso[ i ].offsety = 6; break;
               case 81: dso[ i ].offsetx = -24; dso[ i ].offsety = 0; break;
               case 86: dso[ i ].offsetx = -24; break;
               default: break;
            }
            break;
         case 2:
            switch ( dso[ i ].id ) {
               case 869:  dso[ i ].name = "869/884"; break;
               default: break;
            }
            break;
         default: break;
      }
   }
}


function init_planets( planet )
{
   var seps = 0.397777156;
   var ceps = 0.917482062;

   var so, co, si, ci, sw, cw, f1, f2;
   
   for ( i = 0; i < 9; i++ ) {
      so = Math.sin( planet[ i ].o );
      co = Math.cos( planet[ i ].o );
      si = Math.sin( planet[ i ].i );
      ci = Math.cos( planet[ i ].i );
      sw = Math.sin( planet[ i ].wb - planet[ i ].o );
      cw = Math.cos( planet[ i ].wb - planet[ i ].o );

      f1 = cw * so + sw * co * ci;
      f2 = cw * co * ci - sw * so;

      planet[ i ].P = [];
      planet[ i ].Q = [];
      planet[ i ].P[ 0 ] = cw * co - sw * so * ci;
      planet[ i ].P[ 1 ] = ceps * f1 - seps * sw * si;
      planet[ i ].P[ 2 ] = seps * f1 + ceps * sw * si;
      planet[ i ].Q[ 0 ] = -sw * co - cw * so * ci;
      planet[ i ].Q[ 1 ] = ceps * f2 - seps * cw * si;
      planet[ i ].Q[ 2 ] = seps * f2 + ceps * cw * si;
      
      switch ( i ) {
         case 2:  planet[ i ].radius = 5;  break;
         case 8:  planet[ i ].radius = 2;  break;
         default: planet[ i ].radius = 3;  break;
      }
      planet[ i ].bright = true;
   }
}

   
function find_planet( planet, earth, jd )
{
   function kepler( m, e )
   {
      var EPSILON = 1.0e-6;
      var d, ae = m;
      
      while ( true ) {
         d = ae - ( e * Math.sin( ae )) - m;
         if ( Math.abs( d ) < EPSILON ) break;
         d /= 1.0 - ( e * Math.cos( ae ));
         ae -= d;
      }
      return 2.0 *
         Math.atan( Math.sqrt(( 1.0 + e ) / ( 1.0 - e )) * Math.tan( ae / 2.0 ));
   }

   var t = ( jd - Astro.JD_J2000 ) / 36525.0;
   var m = planet.L - planet.wb + planet.dL * t;  /* mean anomaly */
   m = Astro.range( m, Math.PI * 2.0 );

   var v = kepler( m, planet.e );
   var cv = Math.cos( v );
   var sv = Math.sin( v );
   var r = ( planet.a * ( 1.0 - planet.e * planet.e )) / ( 1 + planet.e * cv );

   planet.hx = r * ( planet.P[ 0 ] * cv + planet.Q[ 0 ] * sv );
   planet.hy = r * ( planet.P[ 1 ] * cv + planet.Q[ 1 ] * sv );
   planet.hz = r * ( planet.P[ 2 ] * cv + planet.Q[ 2 ] * sv );

   var dx, dy, dz;
   if ( planet.name != "Earth" ) {
      dx = planet.hx - earth.hx;
      dy = planet.hy - earth.hy;
      dz = planet.hz - earth.hz;
   } else {
      dx = -planet.hx;
      dy = -planet.hy;
      dz = -planet.hz;
   }

   planet.pos.ra = Math.atan2( dy, dx );
   planet.pos.dec = Math.atan2( dz, Math.sqrt( dx * dx + dy * dy ));
}


function find_moon( moon, earth, jd )
{
   var P2 = Math.PI * 2.0;
   var ARC = 206264.8062;
   var T, L0, L, LS, D, F, DL, S, H, N, M, C;
   var mlon, mlat;

   /* calculate the Moon's ecliptic longitude and latitude */
   T  = ( jd - 2451545.0 ) / 36525.0;

   L0 =      Astro.range( 0.606433 + 1336.855225 * T, 1.0 );
   L  = P2 * Astro.range( 0.374897 + 1325.552410 * T, 1.0 );
   LS = P2 * Astro.range( 0.993133 +   99.997361 * T, 1.0 );
   D  = P2 * Astro.range( 0.827361 + 1236.853086 * T, 1.0 );
   F  = P2 * Astro.range( 0.259086 + 1342.227825 * T, 1.0 );

   DL = 22640 * Math.sin( L ) +
        -4586 * Math.sin( L - 2 * D ) +
         2370 * Math.sin( 2 * D ) +
          769 * Math.sin( 2 * L ) +
         -668 * Math.sin( LS ) +
         -412 * Math.sin( 2 * F ) +
         -212 * Math.sin( 2 * L - 2 * D ) +
         -206 * Math.sin( L + LS - 2 * D ) +
          192 * Math.sin( L + 2 * D ) +
         -165 * Math.sin( LS - 2 * D ) +
         -125 * Math.sin( D ) +
         -110 * Math.sin( L + LS ) +
          148 * Math.sin( L - LS ) +
          -55 * Math.sin( 2 * F - 2 * D );

   S  = F + ( DL + 412 * Math.sin( 2 * F ) + 541 * Math.sin( LS )) / ARC;
   H  = F - 2 * D;
   N  = -526 * Math.sin( H ) +
          44 * Math.sin( L + H ) +
         -31 * Math.sin( -L + H ) +
         -23 * Math.sin( LS + H ) +
          11 * Math.sin( -LS + H ) +
         -25 * Math.sin( -2 * L + F ) +
          21 * Math.sin( -L + F );

   /* epoch of date! */
   mlon = P2 * Astro.range( L0 + DL / 1296000.0, 1.0 );
   mlat = ( 18520.0 * Math.sin( S ) + N ) / ARC;

   /* convert Sun equatorial J2000 to ecliptic coordinates at epoch jd */ 
   /* "Earth" ra and dec are really geocentric Sun coordinates */
   var coord = [ earth.pos.ra, earth.pos.dec ];
   Astro.ecl_eq( Astro.EQtoECL, coord, coord );
   Astro.precess( Astro.JD_J2000, jd, coord );

   /* calculate Moon phase */
   D = mlon - coord[ 0 ];
   moon.phase = Math.acos( Math.cos( D ) * Math.cos( mlat ));
   if ( Math.sin( D ) < 0.0 )
      moon.phase = P2 - moon.phase;
   moon.phase -= Math.PI;

   /* convert Moon ecliptic to equatorial coordinates */
   coord[ 0 ] = mlon;
   coord[ 1 ] = mlat;
   Astro.ecl_eq( Astro.ECLtoEQ, coord, coord );
   Astro.precess( jd, Astro.JD_J2000, coord );
   moon.pos.ra = coord[ 0 ];
   moon.pos.dec = coord[ 1 ];

   /* calculate position angle of the bright limb */
   var sa  = Math.sin( earth.pos.ra - moon.pos.ra );
   var ca  = Math.cos( earth.pos.ra - moon.pos.ra );
   var sd0 = Math.sin( earth.pos.dec );
   var cd0 = Math.cos( earth.pos.dec );
   var sd  = Math.sin( moon.pos.dec );
   var cd  = Math.cos( moon.pos.dec );

   moon.posAngle = Math.atan2( cd0 * sa, sd0 * cd - cd0 * sd * ca );   
}
