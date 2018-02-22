/*
======================================================================
observer.js

Ernie Wright  2 June 2013
====================================================================== */

function Observer()
{
   var d = new Date();
   this.jd = Astro.JD_1970 + d.getTime() / 86400000.0;
   this.longitude = Astro.degrad( -0.25 * d.getTimezoneOffset());
   this.latitude = Astro.degrad( 40.0 );
   this.initLST();
}
      
Observer.prototype.setJD = function( jd ) {
      this.jd = jd;
      this.initLST();
}
   
Observer.prototype.getDate = function() {
   return new Date( Math.round(( this.jd - Astro.JD_1970 ) * 86400000.0 ));
}
   
Observer.prototype.setDate = function( date ) {
   this.jd = Astro.JD_1970 + date.getTime() / 86400000.0;
   this.initLST();
}
   
Observer.prototype.incHour = function( count ) {
   this.jd += count / 24.0;
   this.initLST();
}
   
Observer.prototype.getLatDegrees = function() {
   return Math.round( Astro.raddeg( this.latitude ));
}
   
Observer.prototype.setLatDegrees = function( lat ) {
   this.latitude = Astro.degrad( lat );
}

Observer.prototype.getLonDegrees = function() {
   return Math.round( Astro.raddeg( this.longitude ));
}
   
Observer.prototype.setLon = function( lon ) {
   this.longitude = lon;
   this.initLST();
}
   
Observer.prototype.setLonDegrees = function( lon ) {
   this.longitude = Astro.degrad( lon );
   this.initLST();
}
   
Observer.prototype.jd_day = function() {
   return Math.floor( this.jd - 0.5 ) + 0.5;
}
   
Observer.prototype.jd_hour = function() {
   return ( this.jd - this.jd_day() ) * 24.0;
}
   
Observer.prototype.initLST = function() {
   this.lst = Astro.range( this.gst() + this.longitude, 2 * Math.PI );
}
   
Observer.prototype.gst = function() {
   var t = ( this.jd_day() - Astro.JD_J2000 ) / 36525;
   var theta = 1.753368559146 + t * ( 628.331970688835
      + t * ( 6.770708e-6 + t * -1.48e-6 ));
   return Astro.range( theta + Astro.hrrad( this.jd_hour() ), 2 * Math.PI );
}
