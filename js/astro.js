/*
======================================================================
astro.js

Ernie Wright  2 June 2013
====================================================================== */

var Astro =
{
   JD_J2000: 2451545.0,
   JD_1970: 2440587.5,
   YEARDAYS: 365.2422,
   EQtoECL: 1,
   ECLtoEQ: -1,
   
   range: function( v, r ) {
      return v - r * Math.floor( v / r );
   },

   degrad: function( x ) {
      return x * 1.74532925199433e-2;
   },

   raddeg: function( x ) {
      return x * 5.729577951308232e1;
   },
   
   hrrad: function( x ) {
      return x * 2.617993877991494e-1;
   },
   
   radhr: function( x ) {
      return x * 3.819718634205488;
   },
   
   /* from[] and to[] contain (azimuth, altitude) and
      (hour angle, declination) */
   aa_hadec: function( lat, from, to )
   {
      var slat = Math.sin( lat );
      var clat = Math.cos( lat );
      var sx   = Math.sin( from[ 0 ] );
      var cx   = Math.cos( from[ 0 ] );
      var sy   = Math.sin( from[ 1 ] );
      var cy   = Math.cos( from[ 1 ] );

      to[ 0 ] = Math.atan2( -cy * sx, -cy * cx * slat + sy * clat );
      to[ 1 ] = Math.asin( sy * slat + cy * clat * cx );
   },
   
   /* from[] and to[] contain (lam, bet) and (ra, dec) */
   /* if sw = EQtoECL, from[] is (ra, dec) */
   ecl_eq: function( sw, from, to )
   {
      var eps = Astro.degrad( 23.45229444 );
      var seps = Math.sin( eps );
      var ceps = Math.cos( eps );

      var sy = Math.sin( from[ 1 ] );
      var cy = Math.cos( from[ 1 ] );
      if ( Math.abs( cy ) < 1e-20 ) cy = 1e-20;
      var ty = sy / cy;
      var cx = Math.cos( from[ 0 ] );
      var sx = Math.sin( from[ 0 ] );
   
      to[ 1 ] = Math.asin(( sy * ceps ) - ( cy * seps * sx * sw ));
      to[ 0 ] = Math.atan2((( sx * ceps ) + ( ty * seps * sw )), cx );
      to[ 0 ] = Astro.range( to[ 0 ], 2 * Math.PI );
   },

   precess: function( jd1, jd2, coord )
   {
      var zeta_A, z_A, theta_A;
      var T;
      var A, B, C;
      var alpha, delta;
      var alpha_in, delta_in;
      var from_equinox, to_equinox;
      var alpha2000, delta2000;

      from_equinox = ( jd1 - Astro.JD_J2000 ) / Astro.YEARDAYS;
      to_equinox   = ( jd2 - Astro.JD_J2000 ) / Astro.YEARDAYS;
      alpha_in = coord[ 0 ];
      delta_in = coord[ 1 ];

      /* From from_equinox to 2000.0 */

      if ( from_equinox != 0.0 ) {
         T = from_equinox / 100.0;
         zeta_A  = Astro.degrad( T * ( 0.6406161 + T * (  8.39e-5  + T * 5.0e-6 )));
         z_A     = Astro.degrad( T * ( 0.6406161 + T * (  3.041e-4 + T * 5.1e-6 )));
         theta_A = Astro.degrad( T * ( 0.5567530 + T * ( -1.185e-4 + T * 1.16e-5 )));

         A =  Math.sin( alpha_in - z_A ) *  Math.cos( delta_in );
         B =  Math.cos( alpha_in - z_A )
           *  Math.cos( theta_A ) * Math.cos( delta_in )
           +  Math.sin( theta_A ) * Math.sin( delta_in );
         C = -Math.cos( alpha_in - z_A )
           *  Math.sin( theta_A ) * Math.cos( delta_in )
           +  Math.cos( theta_A ) * Math.sin( delta_in );

         alpha2000 = Math.atan2( A, B ) - zeta_A;
         alpha2000 = Astro.range( alpha2000, 2 * Math.PI );
         delta2000 = Math.asin( C );
      }
      else {
         alpha2000 = alpha_in;
         delta2000 = delta_in;
      }

      /* From 2000.0 to to_equinox */

      if ( to_equinox != 0.0 ) {
         T = to_equinox / 100.0;
         zeta_A  = Astro.degrad( T * ( 0.6406161 + T * (  8.39e-5  + T * 5.0e-6 )));
         z_A     = Astro.degrad( T * ( 0.6406161 + T * (  3.041e-4 + T * 5.1e-6 )));
         theta_A = Astro.degrad( T * ( 0.5567530 + T * ( -1.185e-4 + T * 1.16e-5 )));

         A = Math.sin( alpha2000 + zeta_A ) * Math.cos( delta2000 );
         B = Math.cos( alpha2000 + zeta_A )
           * Math.cos( theta_A ) * Math.cos( delta2000 )
           - Math.sin( theta_A ) * Math.sin( delta2000 );
         C = Math.cos( alpha2000 + zeta_A )
           * Math.sin( theta_A ) * Math.cos( delta2000 )
           + Math.cos( theta_A ) * Math.sin( delta2000 );

         alpha = Math.atan2( A, B ) + z_A;
         alpha = Astro.range( alpha, 2.0 * Math.PI );
         delta = Math.asin( C );
      }
      else {
         alpha = alpha2000;
         delta = delta2000;
      }

      coord[ 0 ] = alpha;
      coord[ 1 ] = delta;
   }
};