import {getReleaseDataFromTrm} from './trm'

const items: {id: string, tid: number | string, name: string}[] = [
    {id: 'ruby-on-rails', name: 'Ruby On Rails', tid: 11601},
    {id: 'angular-js', name: 'AngularJS', tid: 7842},
    {id: 'docker-desktop-ce', name: 'Docker Desktop Community', tid: 14848}
];

items.forEach( item => {
    getReleaseDataFromTrm(item.tid)
    .then ( res => {
        console.log(`Release data for ${item.name}: `);
        console.log(JSON.stringify(res)); 
    })
    .catch (e => console.error(`some Error: ${e}`));
})