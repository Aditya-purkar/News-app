output "cluster_private_ip"{
    value = aws_instance.newsera.private_ip
    description = "cluster_private_ip"
}

output "cluster_public_ip" {
    value = aws_instance.newsera.public_ip
    description = "cluster_public_ip"
}

output "jenkins_private_ip"{
    value = aws_instance.jenkins.private_ip
    description = "jenkins_private_ip"
}

output "jenkins_public_ip"{
    value = aws_instance.jenkins.public_ip
    description = "jenkins_public_ip"
}
