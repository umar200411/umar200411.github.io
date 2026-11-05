const { test, expect } = require('@playwright/test');
const path = require('node:path');

const sizes = [
  ['desktop-1920x1080',1920,1080], ['reference-1771x831',1771,831],
  ['desktop-1440x900',1440,900], ['laptop-1366x768',1366,768],
  ['desktop-1024x768',1024,768], ['tablet-768x1024',768,1024],
  ['mobile-390x844',390,844], ['mobile-375x812',375,812], ['mobile-320x700',320,700]
];
const getContainer = (page,id) => page.locator(`[data-depot-container="${id}"]`);
const getTrigger = (page,id) => getContainer(page,id).locator('.depot-trigger');
const selectFromNav = async (page,id) => {
  const link=page.locator(`.depot-nav [data-depot-target="${id}"]:visible`).first();
  if(await link.count()) return link.click();
  await page.locator('.depot-explore-toggle').click();
  await page.locator(`.depot-nav [data-depot-target="${id}"]:visible`).first().click();
};

async function loaded(page) {
  await page.goto('/');
  await expect(page.locator('.depot-stage')).toBeVisible();
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','IDLE');
}

async function capture(page,file,options={}) {
  await page.evaluate(async()=>{
    if(document.fonts?.ready) await document.fonts.ready;
    await Promise.all(Array.from(document.images,image=>
      typeof image.decode==='function' ? image.decode().catch(()=>{}) : Promise.resolve()
    ));
  });
  await page.screenshot({path:file,caret:'hide',scale:'css',...options});
}

test('two-column depot renders seven controls and preserves the complete portfolio below it', async ({page}) => {
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await loaded(page);
  await expect(page.locator('[data-depot-container]')).toHaveCount(7);
  await expect(page.locator('.depot-trigger')).toHaveCount(7);
  for(const box of await page.locator('[data-depot-container]').all()) {
    await expect(box.locator('.depot-face')).toHaveCount(6);
    await expect(box.locator('.depot-trigger a')).toHaveCount(0);
  }
  await expect(page.locator('.depot-rail')).toBeVisible();
  await expect(page.locator('.depot-carriage')).toBeVisible();
  await expect(page.getByRole('heading',{name:'I build apps + web that feel alive.'})).toBeVisible();
  expect(await page.locator('.depot-rail').evaluate(el=>el.getBoundingClientRect().left)).toBeGreaterThan(await page.locator('.depot-intro').evaluate(el=>el.getBoundingClientRect().right));
  const pageStructure=await page.evaluate(()=>({
    renderedSectionCount:document.querySelectorAll('.portfolio-details section').length,
    preservedIds:['work','about','experience','expertise','state-lab','services','process','contact'].every(id=>!!document.getElementById(id))
  }));
  expect(pageStructure.renderedSectionCount).toBeGreaterThan(8);
  expect(pageStructure.preservedIds).toBeTruthy();
  expect(errors).toEqual([]);
});

test('original project filters, galleries, and State Lab remain interactive', async ({page}) => {
  await loaded(page);
  await page.locator('#work').scrollIntoViewIfNeeded();
  await page.getByRole('button',{name:'Mobile apps'}).click();
  await expect(page.locator('.project-card--beautify')).toBeVisible();
  await expect(page.locator('.project-card--magnet')).toBeHidden();
  await page.getByRole('button',{name:'Websites'}).click();
  await expect(page.locator('.project-card--magnet')).toBeVisible();
  await page.getByRole('button',{name:'All work'}).click();
  await page.getByRole('button',{name:'Get started'}).click();
  await expect(page.locator('#beautify-screenshot')).toHaveAttribute('alt',/registration screen/);
  await page.locator('#state-lab').scrollIntoViewIfNeeded();
  await page.getByRole('button',{name:'Error',exact:true}).last().click();
  await expect(page.locator('[data-state-title]')).toContainText('Could not complete booking');
});

test('Pulse is the first Work-container project and links to its case study', async ({page}) => {
  await loaded(page);
  await getTrigger(page,'work').click();
  await expect(page.locator('.depot-content-featured-project strong')).toHaveText('Pulse');
  await expect(page.locator('.depot-content-featured-project')).toContainText('IN DEVELOPMENT');
  await expect(page.locator('.depot-content-featured-project a[href="/projects/pulse/?from=depot"]')).toHaveText('View case study ↗');
  const projectNames=await page.locator('.depot-content-entry > strong').allTextContents();
  expect(projectNames).toEqual(['Beautify','Magnet Masala']);
  await page.locator('.depot-content-featured-project a[href="/projects/pulse/?from=depot"]').click();
  await expect(page).toHaveURL(/\/projects\/pulse\/\?from=depot$/);
  await expect(page.locator('[data-pulse-back]').first()).toHaveAttribute('href','/#depot-work');
  await page.locator('[data-pulse-back]').first().click();
  await expect(page).toHaveURL(/#depot-work$/);
  await expect(getContainer(page,'work')).toHaveClass(/is-open/);
});

test('Pulse featured project filters and opens the single detailed case study route', async ({page}) => {
  await loaded(page);
  await page.locator('#work').scrollIntoViewIfNeeded();
  const pulse=page.locator('.project-card--pulse');
  await expect(page.locator('.project-card').first()).toHaveClass(/project-card--pulse/);
  await page.getByRole('button',{name:'Productivity'}).click();
  await expect(pulse).toBeVisible();
  await expect(page.locator('.project-card--beautify')).toBeHidden();
  await page.getByRole('button',{name:'Flutter'}).click();
  await expect(pulse).toBeVisible();
  await pulse.getByRole('link',{name:/View Case Study/}).click();
  await expect(page).toHaveURL(/\/projects\/pulse\/$/);
  await expect(page.getByRole('heading',{name:/Pulse.*Productivity that feels alive/})).toBeVisible();
  await expect(page.locator('.pulse-feature-card')).toHaveCount(10);
  await expect(page.locator('.pulse-screen-placeholder')).toHaveCount(8);
  await expect(page.locator('.pulse-hero-visual')).toContainText('AUTHENTIC APP SCREENS PENDING');
  await expect(page.locator('.pulse-case-main img')).toHaveCount(0);
  await expect(page.locator('.pulse-truth-note')).toContainText('individual completion');
  await expect(page.locator('.pulse-evidence-note')).toContainText('not present here');
  await expect(page.locator('.pulse-cta a[href="/#work"]')).toBeVisible();
  await page.locator('.pulse-cta a[href="/#work"]').click();
  await expect(page).toHaveURL(/#work$/);
});

test('Pulse case study remains readable without horizontal overflow on mobile and tablet', async ({page}) => {
  for(const [width,height] of [[390,844],[320,700],[768,1024]]) {
    await page.setViewportSize({width,height});
    await page.goto('/projects/pulse/');
    await expect(page.getByRole('heading',{name:/Pulse.*Productivity that feels alive/})).toBeVisible();
    await expect(page.locator('.pulse-feature-grid')).toBeVisible();
    const dimensions=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth}));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
  }
});

test('project cards keep the requested gap, column layout, and bounded titles responsively', async ({page}) => {
  for(const [width,height,gap] of [[1920,1080,40],[1440,900,40],[1100,800,32],[944,1400,32],[768,1024,32],[390,844,24]]) {
    await page.setViewportSize({width,height});
    await page.goto('/');
    await page.locator('#work').scrollIntoViewIfNeeded();
    const result=await page.locator('.projects-list').evaluate(list=>{
      const cards=[...list.querySelectorAll('.project-card')];
      const rect=element=>{const r=element.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width,top:r.top,bottom:r.bottom}};
      return {
        rowGap:parseFloat(getComputedStyle(list).rowGap),
        direction:getComputedStyle(cards[0]).flexDirection,
        filterWrap:getComputedStyle(document.querySelector('.project-filters')).flexWrap,
        overflow:document.documentElement.scrollWidth-innerWidth,
        cards:cards.map(card=>{
          const box=rect(card),copy=rect(card.querySelector('.project-copy'));
          const media=rect(card.querySelector('.project-art, .project-media--magnet'));
          const title=card.querySelector('.project-main h3');
          const range=document.createRange(); range.selectNodeContents(title);
          const textRects=[...range.getClientRects()].map(r=>({left:r.left,right:r.right}));
          return {box,copy,media,textRects};
        })
      };
    });
    expect(result.rowGap).toBe(gap);
    expect(result.filterWrap).toBe('wrap');
    expect(result.overflow).toBeLessThanOrEqual(0);
    expect(result.cards).toHaveLength(3);
    for(const {box,copy,media,textRects} of result.cards) {
      for(const line of textRects) {
        expect(line.left).toBeGreaterThanOrEqual(copy.left-1);
        expect(line.right).toBeLessThanOrEqual(copy.right+1);
      }
      if(width>1100) {
        expect(copy.left).toBeCloseTo(box.left,0);
        expect(copy.right).toBeCloseTo(media.left,0);
        expect(copy.width/box.width).toBeGreaterThan(.46);
        expect(copy.width/box.width).toBeLessThan(.50);
      } else {
        expect(result.direction).toBe('column');
        expect(media.top).toBeGreaterThanOrEqual(copy.bottom-1);
      }
    }
  }
});

test('character keeps the supplied still visible when cursor video is absent', async ({page}) => {
  await loaded(page);
  const state=await page.locator('[data-cursor-scrub]').getAttribute('data-scrub-state');
  expect(['poster-only','static']).toContain(state);
  await expect.poll(()=>page.locator('[data-cursor-scrub] img').evaluate(image=>image.naturalWidth)).toBeGreaterThan(0);
  const media=await page.locator('[data-cursor-scrub]').evaluate(root=>({
    still:root.querySelector('img').naturalWidth,
    source:root.querySelector('video').getAttribute('src'),
    muted:root.querySelector('video').muted,
    controls:root.querySelector('video').controls,
    autoplay:root.querySelector('video').autoplay,
    preload:root.querySelector('video').getAttribute('preload'),
    remotePlaybackDisabled:root.querySelector('video').hasAttribute('disableRemotePlayback')
  }));
  expect(media.still).toBeGreaterThan(0);
  expect(media.source).toBeNull();
  expect(media.muted).toBeTruthy();
  expect(media.controls).toBeFalsy();
  expect(media.autoplay).toBeFalsy();
  expect(media.preload).toBe('auto');
  expect(media.remotePlaybackDisabled).toBeTruthy();
});

test('CursorScrubVideo exposes configurable single-axis tracking and an empty-source state', async ({page}) => {
  await page.goto('/');
  const component=await page.evaluate(()=>{
    const root=document.createElement('div');
    document.body.append(root);
    const instance=new window.CursorScrubVideo(root,{axis:'vertical',reverse:true,trackingArea:'component',smoothing:.5,objectFit:'cover',borderRadius:6});
    const result={state:root.dataset.scrubState,message:root.querySelector('.cursor-scrub-empty').textContent,axis:root.dataset.axis,fit:getComputedStyle(root).getPropertyValue('--cursor-scrub-fit'),radius:getComputedStyle(root).getPropertyValue('--cursor-scrub-radius')};
    instance.destroy();
    root.remove();
    return result;
  });
  expect(component.state).toBe('empty');
  expect(component.message).toBe('Add a video file');
  expect(component.axis).toBe('vertical');
  expect(component.fit.trim()).toBe('cover');
  expect(component.radius.trim()).toBe('6px');
});

test('each container opens its own readable dock content', async ({page}) => {
  await loaded(page);
  for(const id of ['intro','work','about','journey','toolkit','services','contact']) {
    const target=getContainer(page,id);
    if(await page.locator('.depot-content-dock').getAttribute('aria-hidden')==='false') {
      await page.keyboard.press('Escape');
      await expect(page.locator('.depot-content-dock')).toBeHidden();
      await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','IDLE');
    }
    await getTrigger(page,id).click();
    await expect(target).toHaveClass(/is-open/);
    await expect(page.locator('.depot-dock-content h2')).toBeVisible();
    await expect(page.locator('.depot-content-dock')).not.toHaveAttribute('inert','');
    await expect(page.locator('.depot-dock-content h2')).toContainText(({intro:'Umar',work:'work',about:'about me',journey:'build',toolkit:'box',services:'do',contact:'idea'})[id]);
  }
},{timeout:120000});

test('pickup passes through mechanical stages and returns previous container', async ({page}) => {
  await loaded(page);
  const original=await getContainer(page,'work').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,transform:getComputedStyle(el).transform}});
  await page.locator('.hero').evaluate(el=>{
    new MutationObserver(()=>el.dataset.testStates=(el.dataset.testStates||'')+' '+el.dataset.depotState)
      .observe(el,{attributes:true,attributeFilter:['data-depot-state']});
  });
  await getTrigger(page,'work').click();
  await expect(getContainer(page,'work')).toHaveClass(/is-open/);
  await selectFromNav(page,'about');
  await expect(getContainer(page,'about')).toHaveClass(/is-open/);
  const states=(await page.locator('.hero').getAttribute('data-test-states')||'').split(/\s+/);
  for(const state of ['MOVING','LOWERING','GRABBING','LIFTING','OPENING','RETURNING']) expect(states).toContain(state);
  await expect(getContainer(page,'work')).not.toHaveClass(/is-selected/);
  await expect(getContainer(page,'about')).toHaveClass(/is-selected/);
  const returned=await getContainer(page,'work').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,transform:getComputedStyle(el).transform}});
  expect(Math.abs(returned.x-original.x)).toBeLessThan(2);
  expect(Math.abs(returned.y-original.y)).toBeLessThan(2);
  expect(returned.transform).toBe(original.transform);
});

test('crane and grip stay aligned with selected container during travel and lift', async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await loaded(page);
  await getTrigger(page,'work').click();
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','MOVING');
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','LOWERING');
  const travelDelta=await page.evaluate(()=>{
    const box=document.querySelector('[data-depot-container="work"] .depot-trigger').getBoundingClientRect();
    const claw=document.querySelector('.depot-carriage').getBoundingClientRect();
    return Math.abs((box.left+box.width/2)-(claw.left+claw.width/2));
  });
  expect(travelDelta).toBeLessThan(6);
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','LIFTING');
  await expect(getContainer(page,'work')).toHaveClass(/is-open/);
});

test('resizing during transfer keeps the crane and selected load aligned', async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await loaded(page);
  await getTrigger(page,'work').click();
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','LIFTING');
  await page.setViewportSize({width:1024,height:768});
  await expect(getContainer(page,'work')).toHaveClass(/is-open/);
  const aligned=await page.evaluate(()=>{
    const center=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}};
    const box=center('[data-depot-container="work"] .depot-trigger');
    const claw=center('.depot-grip-head');
    const dock=document.querySelector('.depot-content-dock').getBoundingClientRect();
    const workspace=document.querySelector('.depot-workspace').getBoundingClientRect();
    return {dx:Math.abs(box.x-claw.x),dy:Math.abs(box.y-claw.y),dockInside:dock.left>=workspace.left&&dock.right<=workspace.right&&dock.top>=workspace.top&&dock.bottom<=workspace.bottom};
  });
  expect(aligned.dx).toBeLessThan(12);
  expect(aligned.dy).toBeLessThan(14);
  expect(aligned.dockInside).toBeTruthy();
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('.depot-content-dock')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','IDLE');
});

test('rapid selections keep the latest requested container', async ({page}) => {
  await loaded(page);
  await getTrigger(page,'work').click();
  await selectFromNav(page,'toolkit');
  await selectFromNav(page,'contact');
  await expect(getContainer(page,'contact')).toHaveClass(/is-open/,{timeout:25000});
  await expect(getContainer(page,'work')).not.toHaveClass(/is-selected/);
});

test('keyboard, touch, Escape, and reduced motion are supported', async ({page,browser}) => {
  await loaded(page);
  const work=getTrigger(page,'work');
  await work.focus();
  await expect(work).toBeFocused();
  await expect(work).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(getContainer(page,'work')).toHaveClass(/is-open/);
  await expect(page.locator('.depot-dock-content h2')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.depot-content-dock')).toBeHidden();
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','IDLE');
  await expect(work).toBeFocused();
  await page.locator('.depot-explore-toggle').click();
  await page.getByRole('link',{name:'Toolkit'}).last().focus();
  await page.keyboard.press('Enter');
  await expect(getContainer(page,'toolkit')).toHaveClass(/is-open/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.depot-content-dock')).toBeHidden();
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','IDLE');
  const contact=getTrigger(page,'contact');
  await contact.focus();
  await page.keyboard.press('Space');
  await expect(getContainer(page,'contact')).toHaveClass(/is-open/);
  await page.locator('.depot-dock-close').click();
  await expect(page.locator('.depot-content-dock')).toBeHidden();
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','IDLE');
  const context=await browser.newContext({reducedMotion:'reduce'});
  const reducedPage=await context.newPage();
  await reducedPage.goto('/');
  await expect(reducedPage.locator('.depot-intro')).toBeVisible();
  await getTrigger(reducedPage,'work').click();
  await expect(getContainer(reducedPage,'work')).toHaveClass(/is-open/);
  await context.close();
  const touchContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const touchPage=await touchContext.newPage();
  await loaded(touchPage);
  await getTrigger(touchPage,'contact').tap();
  await expect(getContainer(touchPage,'contact')).toHaveClass(/is-open/);
  await touchPage.locator('.depot-dock-close').tap();
  await expect(touchPage.locator('.hero')).toHaveAttribute('data-depot-state','IDLE');
  await touchContext.close();
},{timeout:60000});

test('navigation activates depot containers and real project/contact links are retained', async ({page}) => {
  await loaded(page);
  await page.locator('.depot-shortcuts a[data-depot-target="work"]').click();
  await expect(getContainer(page,'work')).toHaveClass(/is-open/);
  await expect(page.locator('.depot-dock-content a[href="https://play.google.com/store/apps/details?id=com.umar.beautify"]')).toHaveCount(1);
  await expect(page.locator('.depot-dock-content a[href="https://magnetmasala.com/"]')).toHaveCount(1);
  await expect(page.locator('.depot-dock-content a[href^="mailto:umar@umarsaeedqureshi.com"]')).toHaveCount(1);
  await selectFromNav(page,'toolkit');
  await page.getByRole('button',{name:'Success',exact:true}).click();
  await expect(page.locator('.depot-state-output')).toContainText('action completed');
  await page.locator('.depot-shortcuts a[data-depot-target="journey"]').click();
  await expect(getContainer(page,'journey')).toHaveClass(/is-open/);
  await expect(page.locator('.depot-dock-content')).toContainText('Discover');
  await page.locator('.depot-shortcuts a[data-depot-target="about"]').click();
  await expect(page.locator('.depot-dock-content a[href="/assets/Umar-Saeed-Qureshi-Resume.pdf"]')).toHaveCount(1);
  await selectFromNav(page,'contact');
  await expect(page.locator('.depot-dock-content a[href="mailto:umar@umarsaeedqureshi.com"]')).toHaveCount(1);
  await expect(page.locator('.depot-dock-content a[href="https://github.com/umar200411/"]')).toHaveCount(1);
  await expect(page.locator('.depot-dock-content a[href="https://www.linkedin.com/in/umar-saeed-qureshi-8a6484296/"]')).toHaveCount(1);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.locator('#project-brief')).toBeVisible();
  await expect(page.locator('.site-footer a[href="mailto:umar@umarsaeedqureshi.com"]')).toBeVisible();
});

test('stage remains within viewport and captures idle plus opened content at every target size', async ({page}) => {
  for(const [name,width,height] of sizes) {
    await page.setViewportSize({width,height});
    await loaded(page);
    const bounds=await page.evaluate(()=>{
      const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
      const stage=rect('.depot-stage');
      return {
        scrollWidth:document.documentElement.scrollWidth,
        intro:rect('.depot-intro'),workspace:rect('.depot-workspace'),stage,
        containers:[...document.querySelectorAll('.depot-trigger')].map(button=>{const r=button.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}}),
        character:{opacity:getComputedStyle(document.querySelector('.depot-character')).opacity,naturalWidth:document.querySelector('.cursor-scrub-poster')?.naturalWidth||0}
      };
    });
    expect(bounds.scrollWidth).toBeLessThanOrEqual(width);
    if(width>700) expect(bounds.intro.right).toBeLessThanOrEqual(bounds.workspace.x+2);
    for(const box of bounds.containers) {
      expect(box.x).toBeGreaterThanOrEqual(bounds.stage.x-8);
      expect(box.right).toBeLessThanOrEqual(bounds.stage.right+8);
      expect(box.y).toBeGreaterThanOrEqual(bounds.stage.y-8);
      expect(box.bottom).toBeLessThanOrEqual(bounds.stage.bottom+8);
    }
    expect(Number(bounds.character.opacity)).toBeGreaterThan(.8);
    expect(bounds.character.naturalWidth).toBeGreaterThan(0);
    await page.evaluate(()=>window.scrollTo(0,0));
    await capture(page,path.join('test-results',name+'-initial.png'),{animations:'disabled'});
    for(const id of ['about','work','contact']) {
      if(await page.locator('.depot-content-dock').getAttribute('aria-hidden')==='false') await page.keyboard.press('Escape');
      await getTrigger(page,id).click();
      await expect(getContainer(page,id)).toHaveClass(/is-open/);
      await expect(page.locator('.depot-dock-content')).toBeVisible();
      const panel=await page.locator('.depot-content-dock').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,scrollHeight:el.querySelector('.depot-dock-content').scrollHeight,clientHeight:el.querySelector('.depot-dock-content').clientHeight}});
      expect(await page.locator('.depot-dock-content').evaluate(el=>getComputedStyle(el).overflowY)).toBe('auto');
      if(id==='about' && width<=1024) {
        expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
        const scroll=await page.locator('.depot-dock-content').evaluate(el=>{el.scrollTop=el.scrollHeight;return el.scrollTop});
        expect(scroll).toBeGreaterThan(0);
      }
      const workspace=await page.locator('.depot-workspace').boundingBox();
      expect(panel.x).toBeGreaterThanOrEqual(workspace.x);
      expect(panel.right).toBeLessThanOrEqual(workspace.x+workspace.width);
      expect(panel.y).toBeGreaterThanOrEqual(workspace.y);
      expect(panel.bottom).toBeLessThanOrEqual(workspace.y+workspace.height);
      await capture(page,path.join('test-results',name+'-'+id+'-open.png'),{animations:'disabled'});
      await page.keyboard.press('Escape');
      await expect(page.locator('.depot-content-dock')).toBeHidden();
      await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','IDLE');
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
},{timeout:240000});

test('captures a representative container return and pickup transition', async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await loaded(page);
  await getTrigger(page,'work').click();
  await expect(getContainer(page,'work')).toHaveClass(/is-open/);
  await getTrigger(page,'about').click();
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','RETURNING');
  await expect(getContainer(page,'work')).not.toHaveClass(/is-selected/);
  await capture(page,path.join('test-results','desktop-1440x900-switch-work-to-about.png'));
  await expect(getContainer(page,'about')).toHaveClass(/is-open/);
});
