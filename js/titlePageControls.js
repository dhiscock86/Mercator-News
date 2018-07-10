/**********************************************************************************************************
 * Title: titlePageControls.js
 * Purpose: Apply effects / events to main title page using jquery
 * Author: Daniel Hiscock
 * Date: May 2018
 * Disclaimer: Capstone Project for the completion of the Advanced Goegraphic Sciences Program at COGS
 **********************************************************************************************************/

 // The following are jQuery eventListeners for collapsible panels in the main page
 // Note: using these mouse over / mouse leave events are not ideal using a CDN
 
$(".colImages1").mouseover(
	function () {
		console.log("mouse enter");
		$('.panel-collapse1').collapse('show');
	});
$(".colImages1").mouseleave(
	function () {
		console.log("mouse enter");
		$('.panel-collapse1').collapse('hide');
	});

$(".colImages2").mouseover(
	function () {
		console.log("mouse enter");
		$('.panel-collapse2').collapse('show');
	});
$(".colImages2").mouseleave(
	function () {
		console.log("mouse enter");
		$('.panel-collapse2').collapse('hide');
	});

$(".colImages3").mouseover(
	function () {
		console.log("mouse enter");
		$('.panel-collapse3').collapse('show');
	});
$(".colImages3").mouseleave(
	function () {
		console.log("mouse enter");
		$('.panel-collapse3').collapse('hide');
	});