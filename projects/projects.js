import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
    projectsTitle.textContent = `${projects.length} Projects`;
}

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

let query = '';
let selectedYear = null;

function getSearchFiltered() {
    return projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });
}

function applyFilters() {
    let filtered = getSearchFiltered();
    if (selectedYear !== null) {
        filtered = filtered.filter((project) => project.year === selectedYear);
    }
    renderProjects(filtered, projectsContainer, 'h2');
}

function renderPieChart(projectsGiven) {
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );
    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });
    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => arcGenerator(d));
    let newSVG = d3.select('svg');
    newSVG.selectAll('path').remove();
    let legend = d3.select('.legend');
    legend.selectAll('li').remove();

    newArcs.forEach((arc, idx) => {
        newSVG
            .append('path')
            .attr('d', arc)
            .attr('fill', colors(idx))
            .attr('class', newData[idx].label === selectedYear ? 'selected' : '')
            .on('click', () => {
                selectedYear = selectedYear === newData[idx].label ? null : newData[idx].label;
                applyFilters();
                renderPieChart(getSearchFiltered());
            });
    });
    newData.forEach((d, idx) => {
        legend
            .append('li')
            .attr('style', `--color:${colors(idx)}`)
            .attr('class', d.label === selectedYear ? 'legend-item selected' : 'legend-item')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
}

renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    query = event.target.value;
    applyFilters();
    renderPieChart(getSearchFiltered());
});
