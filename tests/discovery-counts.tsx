import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DiscoverView } from '../src/components/DiscoverView';
import { initialCurrentUser, localSinglesData } from '../src/data/mockProfiles';

const profiles = [
  { ...localSinglesData[0], id: 'actual-near', locality: 'Sonari', distanceKm: 2, passions: ['#Coffee', '#Coffee'] },
  { ...localSinglesData[1], id: 'actual-far', locality: 'Sonari', distanceKm: 40, passions: ['#Coffee'] },
  { ...localSinglesData[0], id: 'actual-other', locality: 'Kadma', distanceKm: 3, passions: ['#Cycling'] },
];
function render(tag?: string) {
  return renderToStaticMarkup(<DiscoverView currentUser={{...initialCurrentUser, maxDistanceRadiusKm: 25}}
    profiles={profiles} likedProfileIds={[]} onLike={()=>{}} onPass={()=>{}} onOpenDetails={()=>{}}
    onStartChat={()=>{}} onLocationChange={async()=>true} initialSelectedTag={tag} />);
}
const html = render();
assert.ok(html.includes('Showing 2 of 3 profiles'));
assert.ok(html.includes('All Localities (2)'));
assert.ok(/<span>Sonari<\/span><span[^>]*>\(2\)/.test(html), 'Locality count includes profiles beyond the radius');
assert.ok(/#Coffee<\/span><span[^>]*>\(1\)/.test(html), 'Count profiles, not duplicate tags; respect radius');
const coffee = render('#Coffee');
assert.ok(coffee.includes('Showing 1 of 3 profiles'));
assert.ok(coffee.includes('All Localities (1)'));
assert.ok(!coffee.includes('actual-far'));
console.log('PASS: profile totals, radius-aware locality/hobby counts, duplicate tags and active hobby filtering');
