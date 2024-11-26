import {trigger, group, style, animate, transition, query, animateChild,} from '@angular/animations';

export const slideInAnimation =
  trigger('routeAnimations', [
    transition('login <=> register, login <=> home, register <=> home', [
      style({position: 'relative'}),
      query(':enter, :leave', [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%'
        })
      ], {optional: true}),
      query(':enter', [
        style({left: '-100%'})
      ], {optional: true}),
      group([
        query(':leave', [
          animate('300ms ease-out', style({left: '100%'}))
        ], {optional: true}),
        query(':enter', [
          animate('300ms ease-out', style({left: '0%'}))
        ], {optional: true}),
        query('@*', animateChild(), {optional: true})
      ]),
    ]),
    transition('* <=> *', [
      style({position: 'relative'}),
      query(':enter, :leave', [
        style({
          position: 'absolute',
          left: 0,
          width: '100%',
          opacity: 0,
          transform: 'scale(0) translateY(100%)',
        }),
      ]),
      query(':enter', [
        animate('200ms ease', style({opacity: 1, transform: 'scale(1) translateY(0)'})),
      ])
    ])
  ]);
