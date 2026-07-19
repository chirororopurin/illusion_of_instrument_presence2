# Experiment System

This directory contains the web-based experimental system used in the study.

The experiment was implemented using HTML, CSS, and JavaScript and was designed to run in a web browser. The system presents the experimental stimuli, collects participant responses, and records the experimental data.

## File Description

| File | Description |
|------|-------------|
| `index.html` | Start page of the experiment. This page provides an overview of the study, presents the informed consent form, and collects participants' demographic information. |
| `test.html` | Practice session presented before the main experiment. Participants familiarize themselves with the experimental procedure using a practice stimulus (`test.mp4`). |
| `experiment.html` | Main experimental interface used to present the stimuli and collect participant responses throughout the experiment. |
| `end.html` | Final page displayed after successful completion of the experiment. |
| `error.html` | Page displayed when the experiment is terminated because invalid data were detected (excluding failures of the attention-check task). |
| `test.mp4` | Practice video used during the training session before the main experiment. |

## Implementation

The experiment was implemented using standard web technologies:

- HTML
- CSS
- JavaScript

The system records participant responses, including questionnaire responses and visual mapping annotations, for subsequent statistical analysis.
