##################################################
# H3: Relationship between illusion perception
# and aesthetic evaluation
#
# Linear Mixed Model
#
# Fixed effect:
#   Illusion perception
#
# Random effect:
#   Participant ID
##################################################

library(lme4)
library(lmerTest)


# Load data
df <- read.csv(
  "H3_illusion_aesthetic_long.csv",
  stringsAsFactors = TRUE
)


# Convert variables
df$ID <- factor(df$ID)

df$Illusion <- factor(
  df$Illusion,
  levels = c(0,1)
)


# Linear mixed-effects model
model_H3 <- lmer(
  Aesthetic_Score ~ Illusion + (1 | ID),
  data = df
)


# Model summary
summary(model_H3)


# Fixed-effect coefficients
fixef(model_H3)
