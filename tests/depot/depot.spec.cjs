const { test, expect } = require('@playwright/test');
const path = require('node:path');

const sizes = [
  ['desktop-1440x900',1440,900], ['desktop-1024x768',1024,768],
  ['tablet-768x1024',768,1024], ['mobile-390x844',390,844], ['mobile-320x700',320,700]
];
const sectionIds = ['work','about','experience','expertise','state-lab','services','process','contact'];
const container = (page,id) => page.locator('[data-depot-container="'+id+'"]');

async function loaded(page) {
  await page.goto('/');
  await expect(page.locator('.depot-stage')).toBeVisible();
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','OPEN');
}

test('initial stage, all seven containers, crane, navigation, and original sections render without errors', async ({page}) => {
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await loaded(page);
  await expect(page.locator('[data-depot-container]')).toHaveCount(7);
  await expect(page.locator('.depot-rail')).toBeVisible();
  await expect(page.locator('.depot-carriage')).toBeVisible();
  await expect(page.getByRole('heading',{name:/I build apps \+ web/})).toBeVisible();
  for(const id of sectionIds) await expect(page.locator('#'+id)).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('captures initial, introduction, work, and contact states at five viewport sizes', async ({page}) => {
  for(const [name,width,height] of sizes) {
    await page.setViewportSize({width,height});
    await loaded(page);
    await page.screenshot({path:path.join('test-results',name+'-initial.png')});
    for(const id of ['intro','work','contact']) {
      const target=container(page,id);
      if(id!=='intro') await target.click({force:true});
      await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','OPEN');
      await expect(target.locator('.depot-card-content')).toBeVisible();
      await page.screenshot({path:path.join('test-results',name+'-'+id+'-open.png')});
      if(id!=='intro') await container(page,'intro').click({force:true});
      await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','OPEN');
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
});

test('each container opens its own readable content', async ({page}) => {
  await loaded(page);
  for(const id of ['intro','work','about','journey','toolkit','services','contact']) {
    const target=container(page,id);
    await target.click({force:true});
    await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','OPEN');
    await expect(target.locator('.depot-card-content h2')).toBeVisible();
  }
});

test('pickup transitions through mechanical stages and return restores previous container', async ({page}) => {
  await loaded(page);
  await page.locator('.hero').evaluate(el=>{
    new MutationObserver(()=>el.dataset.testStates=(el.dataset.testStates||'')+' '+el.dataset.depotState)
      .observe(el,{attributes:true,attributeFilter:['data-depot-state']});
  });
  await container(page,'work').click({force:true});
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','OPEN');
  await container(page,'about').click({force:true});
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','OPEN');
  const states=(await page.locator('.hero').getAttribute('data-test-states')||'').split(/\s+/);
  for(const state of ['MOVING','LOWERING','GRABBING','LIFTING','OPENING','RETURNING']) expect(states).toContain(state);
  await expect(container(page,'work')).not.toHaveClass(/is-selected/);
  await expect(container(page,'about')).toHaveClass(/is-selected/);
});

test('carriage and grip stay horizontally aligned with the moving load', async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await loaded(page);
  const target=container(page,'work');
  await target.click({force:true});
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','MOVING');
  const travelDelta=await page.evaluate(()=>{
    const box=document.querySelector('[data-depot-container="work"]').getBoundingClientRect();
    const claw=document.querySelector('.depot-carriage').getBoundingClientRect();
    return Math.abs((box.left+box.width/2)-(claw.left+claw.width/2));
  });
  expect(travelDelta).toBeLessThan(4);
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','LOWERING');
  const gripDelta=await page.evaluate(()=>{
    const box=document.querySelector('[data-depot-container="work"]').getBoundingClientRect();
    const claw=document.querySelector('.depot-grip-head').getBoundingClientRect();
    return Math.abs((box.left+box.width/2)-(claw.left+claw.width/2));
  });
  expect(gripDelta).toBeLessThan(4);
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','LIFTING');
  const liftDelta=await page.evaluate(()=>{
    const box=document.querySelector('[data-depot-container="work"]').getBoundingClientRect();
    const claw=document.querySelector('.depot-grip-head').getBoundingClientRect();
    return Math.abs((box.left+box.width/2)-(claw.left+claw.width/2));
  });
  expect(liftDelta).toBeLessThan(4);
  await expect(page.locator('.hero')).toHaveAttribute('data-depot-state','OPEN');
});

test('rapid selection queue ends at the latest requested container', async ({page}) => {
  await loaded(page);
  await container(page,'work').click({force:true});
  await container(page,'toolkit').click({force:true});
  await container(page,'contact').click({force:true});
  await expect(container(page,'contact')).toHaveClass(/is-open/,{timeout:20000});
});

test('keyboard activation, focus, Escape, and reduced motion work', async ({page,browser}) => {
  await loaded(page);
  const work=container(page,'work');
  await work.focus();
  await expect(work).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(work).toHaveClass(/is-open/);
  await page.keyboard.press('Escape');
  await expect(container(page,'intro')).toHaveClass(/is-open/);
  const context=await browser.newContext({reducedMotion:'reduce'});
  const reducedPage=await context.newPage();
  await reducedPage.goto('/');
  await expect(container(reducedPage,'intro')).toHaveClass(/is-open/);
  await container(reducedPage,'work').click({force:true});
  await expect(container(reducedPage,'work')).toHaveClass(/is-open/);
  await context.close();
});

test('existing project filter, gallery, State Lab, navigation, and mail links remain available', async ({page}) => {
  await loaded(page);
  await page.locator('.depot-shortcuts a[href="#work"]').click();
  await expect(page).toHaveURL(/#work$/);
  await page.locator('[data-filter="mobile"]').click();
  await expect(page.locator('[data-project-type]').first()).toBeVisible();
  await page.locator('.screenshot-gallery .demo-control').nth(1).click();
  await expect(page.locator('.screenshot-gallery img:visible').first()).toBeVisible();
  await page.locator('[data-state="success"]').click();
  await expect(page.locator('[data-state-title]')).toContainText(/Booking confirmed/i);
  await expect(page.locator('a[href^="mailto:umar@umarsaeedqureshi.com"]')).toHaveCount(2);
});
